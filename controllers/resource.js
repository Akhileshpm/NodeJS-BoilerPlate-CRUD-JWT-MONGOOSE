import config  from "config";
import validator from "validator";
import mongoose from "mongoose";

import Resource from "../models/resource";
import logger from "../logger";

const {NOT_FOUND, BAD_REQUEST, NO_CONTENT, INTERNAL_SERVER_ERROR} = config.get('HTTP_STATUS_CODES');
const { FAILURE } = config.get("RESPONSE_MSG");

const createResource = async (req, res) => {
  logger.info("Adding new resource started");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const resourceData = req.body;
    //LOGIC GOES HERE
    return res.status(201).send("Resource created successfully");

  } catch (error) {
    logger.error(error);
    logger.error("Adding new resource failed");

    res.status(400).send(error);
  }
};
const getAllResources = async (req, res) => {
  try {
    logger.info("started fetching all resources");

  
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

    logger.info('Resource deletion by uuid success');

    return res.status(NO_CONTENT).send();
  } catch (error) {
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
    const updates = Object.keys(resourceData);
    const resource = await Resource.findOne({ uuid: req.params.resourceId });

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

    logger.info("Updating resource details success");
    return res.send(resource);

  } catch (error) {
    logger.error(error);
    logger.error("Updating resource details failed");

    res.status(error?.status || INTERNAL_SERVER_ERROR).send(FAILURE);
  }
};

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
