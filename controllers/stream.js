import config from "config";
import mongoose from "mongoose";
import validator from "validator";
import { 
  addResourceToStreamsAndTeams,
  removeResourceFromStreamByObjectIds,
  removeResourceFromTeamByObjectIds,
  removeStreamFromResource,
  changeApprovedStatusOfResources } from "../helpers/utils";
import logger from "../logger";
import paginateHelper from "../helpers/paginate";
import Resource from "../models/resource";
import Stream from "../models/stream";
import Team from "../models/team";

const { NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR } =
  config.get("HTTP_STATUS_CODES");
const { TEAM } = config.get("STREAM_ROLES");
const {LIMIT_DEFAULT, PAGE_NO_DEFAULT} = config.get("PAGINATION");

const createStream = async (req, res) => {
  try {
    logger.info("Adding new stream started");

    const stream = new Stream(req.body);

    await stream.save();

    logger.info("Adding new stream success");
    return res.send("Stream created successfully");
  } catch (error) {
    logger.error(error);
    logger.error("Adding new stream failed");
    res.status(400).send(error);
  }
};
const getStreams = async (req, res) => {
  await paginateHelper(req, res, Stream, "stream", { uuid: 1, name: 1 });
};
const getStreamByUUID = async (req, res) => {
  try {
    logger.info("Fetching stream details by uuid started");
    const isApproved = (req.query.isApproved === 'true');
    const leadFilter = { uuid: req.params.streamId };
    const supportingLeadsFilter = { uuid: req.params.streamId };
    const populateSupportingLeads = {
      path: "supportingLeads.resource",
      select: "name email"
    };
    const populateTeam = {      
        path: "resource",
        select: "name email",
    };
    const page = +req.query.page || PAGE_NO_DEFAULT;
    const limit = +req.query.limit || LIMIT_DEFAULT;
    const skip = (page - 1) * limit;
    const {search} = req.query;
    const regex = { $regex: `^${search}`, $options: 'i' };
    
    if(req.query.isApproved){
      leadFilter["lead.isApproved"] = isApproved;
      supportingLeadsFilter["supportingLeads.isApproved"] = isApproved;
    }
    if(search) {
      populateSupportingLeads["match"] = {name: regex};
      populateTeam["match"] = {name:regex};
    }
    
    const stream = await Stream.findOne({ uuid: req.params.streamId }).select(" _id name uuid");
    if(!stream){
      throw {
        status: NOT_FOUND,
        message: `Stream not found for ${req.params.streamId}`,
      }; 
    }

    const lead = await Stream.findOne(leadFilter).select("lead")
    .populate({
      path: "lead.resource",
      select: "name email",
    });

    const supportingLeads = await Stream.findOne(supportingLeadsFilter)
    .select({ supportingLeads: { $slice: ["$supportingLeads", skip, limit] } })
    .populate(populateSupportingLeads);
    const supportingLeadsResult = supportingLeads?.supportingLeads?.filter(obj => obj.resource);

    const teamFilter =  { stream: stream._id };
    if(req.query.isApproved) teamFilter["isApproved"] = isApproved;

    const result = {
        _id: stream._id,
        uuid: stream.uuid,
        name: stream.name,
        leadCount: lead?.lead?.length || 0,
        supportingLeadsCount: supportingLeadsResult.length || 0
    };

    const team = await Team.find(teamFilter)
    .populate(populateTeam)
    .limit(limit)
    .skip(skip);
    const teamResult = team.filter(obj => obj.resource);

    result["teamMembersCount"] = teamResult.length;
    result["totalCount"] =
      result.leadCount +
      result.supportingLeadsCount +
      result["teamMembersCount"];
    
    res.send({
      lead: lead?.lead || [],
      supportingLeads: supportingLeadsResult || [],
      teamMembers: teamResult, 
      result
    });
    logger.info("Fetching stream details by uuid success");

  } catch (error) {

    logger.info("Fetching stream details by uuid failed");
    logger.error(error);
    res
      .status(error.status || INTERNAL_SERVER_ERROR)
      .send({ message: error.message || "operation failed" });
  }
};
const updateStreamById = async (req, res) => {
  try {
    logger.info("Fetching stream details by UUID for update started");

    if (!validator.isUUID(req.params.streamId)) {
      throw { message: "Wrong UUID format passed", status: BAD_REQUEST };
    }

    const updates = Object.keys(req.body);
    const stream = await Stream.findOne({ uuid: req.params.streamId });

    if (!stream) {
      throw { message: "Stream with the given uuid not found", status: NOT_FOUND };
    }

    updates.forEach(
      (update) =>
        (stream[update] = Array.isArray(req.body[update])
          ? [...new Set(req.body[update])]
          : req.body[update])
    );
    await stream.save();

    logger.info("Updating stream details success");
    return res.send({_id: stream._id, name: stream.name});
  } catch (error) {
    logger.error(error);
    logger.error("Updating stream details failed");
    res.status(error?.status || 500).send({ message: error?.message });
  }
};
const deleteStreamByUUID = async (req, res) => {
  try {    
    const [stream] = await Stream.find({uuid: req.params.streamId}).select("_id");
    if(!stream){
      throw { 
        status: NOT_FOUND
      }
    }
    const streamId = stream._id;
    await Team.deleteMany({stream: streamId});
    await Stream.findOneAndDelete({
      uuid: req.params.streamId,
    });
    await Resource.updateMany(
      { streams: streamId },
      { $pull: { streams:  streamId } }
    );
    res.status(204).send({message: 'success'});
  } catch (error) {
    res.status(error?.status || INTERNAL_SERVER_ERROR).send({message: "Operation failed"});
  }
};
const updateResourceInStreams = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    logger.info("started adding resources to streams");

    const additions = req.body?.add || [];
    const deletions = req.body?.delete || [];
    const updates = req.body?.update || [];

    await session.withTransaction(async () => {
      await Promise.all(
        deletions.map(async (obj) => {
          const resourceId = mongoose.Types.ObjectId(obj.resourceId);
          const streamId = mongoose.Types.ObjectId(obj.streamId);
          
          await removeResourceFromTeamByObjectIds(resourceId, Team, [streamId], session);
          await removeResourceFromStreamByObjectIds(resourceId, Stream, [streamId], session);
          await removeStreamFromResource(resourceId, streamId, Resource, session);
        })
      );
      await Promise.all(
        additions.map(async (obj) => {
          const stream = {
            role: obj.role,
            streamId: mongoose.Types.ObjectId(obj.streamId),
            resource: mongoose.Types.ObjectId(obj.resourceId),
            isApproved: obj.isApproved,
            approvedBy: obj.approvedBy,
          };

          await addResourceToStreamsAndTeams(
            [stream],
            mongoose.Types.ObjectId(stream.resource),
            Team,
            Stream,
            session
          );

          await Resource.findByIdAndUpdate(stream.resource, {
            $addToSet: { streams: stream.streamId },
          }).session(session);
      }));
      await changeApprovedStatusOfResources(updates, Stream, Team, session);

    });    
    logger.info("adding resources to streams success");

    res.send({ message: "success" });
  } catch (error) {
    logger.error(error);
    logger.error("adding resources to streams failed!");

    res.status(INTERNAL_SERVER_ERROR).send({ message: "operation failed!" });
  } finally {
    session.endSession();
  }
};

export default {
  updateResourceInStreams,
  createStream,
  deleteStreamByUUID,
  getStreams,
  getStreamByUUID,
  updateStreamById,
};
