import config  from "config";
import validator from "validator";
import mongoose from "mongoose";
import Resource from "../models/resource";
import Team from "../models/team";
import Stream from "../models/stream";
import logger from "../logger";
import paginateHelper from "../helpers/paginate";
import Project from "../models/project";
import Role from "../models/role";
import {
  addResourceToProjects,
  addResourceToStreamsAndTeams,
  getArrayDiff,
  removeResourceFromProject,
  removeResourceFromTeam,
  removeResourceFromStream,
  removeResourceFromProjectByObjectIds,
  removeResourceFromStreamByObjectIds,
  removeResourceFromTeamByObjectIds,
} from "../helpers/utils";

const {NOT_FOUND, BAD_REQUEST, NO_CONTENT, INTERNAL_SERVER_ERROR} = config.get('HTTP_STATUS_CODES');
const { FAILURE } = config.get("RESPONSE_MSG");

const createResource = async (req, res) => {
  logger.info("Adding new resource started");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const resourceData = req.body;
    const projects =  resourceData?.projects || [];
    const streams = resourceData?.streams || [];
    const resource = new Resource({
      name: resourceData.name,
      employeeId: resourceData.employeeId,
      email: resourceData.email,
      grade: resourceData.grade,
      location: resourceData.location,
      virtualTeam: resourceData.virtualTeam,
      projects: projects.map(item => item.projectId),
      streams: streams.map(item => item.streamId),
      joinedAt: resourceData.joinedAt,
    });

    await resource.save({session});
    streams && await Promise.all(streams.map(async stream => {
      if(stream.role === process.env.team){
        const team = new Team({
          stream: stream.streamId,
          resource: resource?._id,
          isApproved: stream.isApproved,
          approvedBy: stream.approvedBy || null
        }); 
        await team.save({session});

      }else{
        await Stream.updateOne(
          { _id: mongoose.Types.ObjectId(stream.streamId) },
          {
            $addToSet: {
               [stream.role]: {
                resource: resource._id,
                isApproved: stream.isApproved,
                approvedBy: stream.approvedBy
              } 
            },
          },
          { session }
        ); 
      }
    }));

    const { _id: managerId } = await Role.findOne({ name: "Project Manager" }).select("_id");

    projects && await Promise.all(projects.map(async project => {
      const update = project.roleId === managerId.toString() ?
      { $addToSet: { managers: resource._id } } :
      { $addToSet: { resources: { resource: resource._id, role: project.roleId } } };
    
      await Project.updateOne({ _id: mongoose.Types.ObjectId(project.projectId) }, update, { session });
    }));

    logger.info("Adding new resource success");

    await session.commitTransaction();
    session.endSession();

    return res.status(201).send("Resource created successfully");

  } catch (error) {
    logger.error(error);
    logger.error("Adding new resource failed");

    await session.abortTransaction();
    session.endSession();

    res.status(400).send(error);
  }
};
const getAllResources = async (req, res) => {
  try {
    logger.info("started fetching all resources");

    const filter = {};

    if(req.query.streams){
      filter["$or"] = [{ streams: { $exists: false } }, { streams: { $size: 0 } }];
    }

    const page = +req.query.page || 0;
    const limit = +req.query.limit || 0;
    const startIndex = (page - 1) * limit;
    const queryValue = req.query.search;
    const regex = { $regex: `^${queryValue}`, $options: 'i' };
  
    const data = await Resource
      .find(req.query.search ? { name : regex, ...filter } : {...filter} , { name:1, email: 1, _id: 1} )
      .limit(limit)
      .skip(startIndex)
      .exec();
      const totalCount = await Resource.countDocuments(req.query.search ? { name : regex, ...filter } : {...filter}, { _id: 1 });
  
    res.send({data, totalCount});

    logger.info("fetching all resources success");
  
  } catch (error) {
    logger.error("fetching resources failed")
    logger.error(error);

    res.status(INTERNAL_SERVER_ERROR).send(FAILURE)
  }
};
const getUnallocatedResources = async (req, res) => {
  try {
    logger.info("Fetching unallocated resources, started");

    const { search: queryValue, filter, grade } = req.query;
    const page = +req.query.page || 0;
    const limit = +req.query.limit || 0;
    const startIndex = (page - 1) * limit;
    const regex = { $regex: `^${queryValue}`, $options: "i" };
    const gradeFilter = grade;

    let fetchQuery = {
      $and: [
        { $or: [{ projects: { $exists: false } }, { projects: { $size: 0 } }] },
      ],
    };

    queryValue && (fetchQuery.name = regex);
    grade && (fetchQuery.grade = gradeFilter);

    filter &&
      fetchQuery.$and.push({
        $or: [{ streams: filter }],
      });

    const result = await Resource.find(fetchQuery)
      .populate({
        path: "streams",
        select: "name",
      })
      .limit(limit)
      .skip(startIndex);

    const totalCount = await Resource.countDocuments(fetchQuery);

    logger.info("Fetching unallocated resources, success");

    res.send({ result, totalCount });
  } catch (error) {
    logger.error(error);
    logger.error("Fetching unallocated resources failed.");

    res.status(INTERNAL_SERVER_ERROR).send(FAILURE);
  }
};
const getAllocatedResources = async (req, res) => {
  try {
    logger.info("Fetching allocated resources started");

    const allocatedResources = await Resource.find({
      projects: { $exists: true, $not: { $size: 0 } },
    });

    logger.info("Fetching allocated resources success");

    return res.send(allocatedResources);

  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).send(FAILURE);

    logger.error("Fetching allocated resources failed");
    logger.error(error);
  }
};
const getResourcesByUUID= async (req, res) => {
  try {
    logger.info("Fetching resources by skillId started");

    const data = await Resource.find(
      {
        uuid: req.params.resourceId 
      },
      { 
        name: 1,
        email: 1, 
        grade: 1,
        location: 1,
        virtualTeam: 1,
        employeeId: 1 
      }
    );

    logger.info("Fetching resources by UUID success");
    res.send(data);
  } catch (error) {
    logger.error(error);
    logger.error("Fetching resources by UUID failed");

    res
      .status(INTERNAL_SERVER_ERROR)
      .send(FAILURE);
  }
};
const deleteResourceById = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const resourceId = req.params.resourceId;
    const { _id: resourceIdToRemove } = await Resource.findOne({ uuid: resourceId }).select("_id");
    
    await Resource.findOneAndDelete({
      uuid: resourceId,
    }).session(session);
    await removeResourceFromProject(resourceIdToRemove, Project, session);
    await removeResourceFromStream(resourceIdToRemove, Stream, session);
    await removeResourceFromTeam(resourceIdToRemove, Team, session);

    await session.commitTransaction();
    session.endSession();  

    logger.info('Resource deletion by uuid success');

    return res.status(NO_CONTENT).send();
  } catch (error) {
    await session.commitTransaction();
    session.endSession();  

    logger.error(error);
    logger.error(`Deleting the resource by uuid failed`);

    res.status(error?.status || INTERNAL_SERVER_ERROR).send(FAILURE);    
  }
};
const updateResourceByUUID = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info("Fetching resource details by UUID for update started");

    if (!validator.isUUID(req.params.resourceId)) {
      throw { message: "Wrong UUID format passed", status: BAD_REQUEST };
    }

    const resourceData = req.body;
    const newProjects =  resourceData.projects;
    const newStreams = resourceData.streams;
    const updates = Object.keys(resourceData);
    const resource = await Resource.findOne({ uuid: req.params.resourceId });
    const oldStreams = resource.streams.map(stream => stream?.toString());
    const oldProjects = resource.projects.map(project => project?.toString());

    if (!resource) {
      throw { message: "Resource with the given uuid not found", status: NOT_FOUND };
    }

    updates.forEach(
      (update) =>
        (resource[update] = Array.isArray(req.body[update])
          ? [...new Set(req.body[update])]
          : req.body[update])
    );

    await resource.save({ session });

    //reflect changes in streams & projects
    if(newStreams){
      let {deletedData: deletedStreams, addedData: addedStreams} = getArrayDiff(oldStreams, newStreams || []);
      deletedStreams = deletedStreams?.map(stream => mongoose.Types.ObjectId(stream));
      addedStreams = addedStreams?.map(stream => mongoose.Types.ObjectId(stream));

      deletedStreams && await removeResourceFromTeamByObjectIds(resource._id, Team, deletedStreams, session);
      deletedStreams && await removeResourceFromStreamByObjectIds(resource._id, Stream, deletedStreams, session);        
      addedStreams && await addResourceToStreamsAndTeams(addedStreams, resource._id, Team, Stream, session);
    }

    if(newProjects){
      let {deletedData: deletedProjects, addedData: addedProjects} = getArrayDiff(oldProjects, newProjects || []);
      deletedProjects = deletedProjects?.map(project => mongoose.Types.ObjectId(project));
      addedProjects = addedProjects?.map(project => mongoose.Types.ObjectId(project));

      deletedProjects && await removeResourceFromProjectByObjectIds(resource._id, Project, deletedProjects, session);
      addedProjects && await addResourceToProjects(addedProjects, resource._id, Role, Project, session);    
    }

    await session.commitTransaction();
    session.endSession();

    logger.info("Updating resource details success");
    return res.send(resource);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(error);
    logger.error("Updating resource details failed");
    res.status(error?.status || INTERNAL_SERVER_ERROR).send(FAILURE);
  }
};
const getGrades = async (req, res) => {
  try {
    logger.info("fetching grades started");
    
    const grades = await Resource.distinct('grade');

    res.send(grades);

    logger.info("fetching grades success")

  } catch (error) {    
    logger.error("fetching grades failed")

    res.status(INTERNAL_SERVER_ERROR).send(FAILURE);
  }
}
export default {
  createResource,
  getAllResources,
  getGrades,
  getUnallocatedResources,
  getAllocatedResources,
  getResourcesByUUID,
  deleteResourceById,
  updateResourceByUUID,
};
