import mongoose from "mongoose";
import config from "config";

const { TEAM } = config.get("STREAM_ROLES");


const getArrayDiff = (oldData, newData) => {
  const oldSet = new Set(oldData);
  const newSet = new Set(newData);
  const addedData = newData.filter(element => !oldSet.has(element));
  const deletedData = oldData.filter(element => !newSet.has(element));
  return { addedData, deletedData };
};
const removeResourceFromProject = async (
  resourceIdToRemove,
  Project,
  session
) => {
  if (!resourceIdToRemove) return;
  const resourceIds = typeof(resourceIdToRemove) === "object" ? { $in: resourceIdToRemove } : resourceIdToRemove;

  await Project.updateMany(
    {
      $or: [
        { "resources.resource": resourceIds },
        { managers: resourceIds },
      ],
    },
    {
      $pull: {
        resources: { resource: resourceIds },
        managers: resourceIds,
      },
    }
  ).session(session);
};
const removeResourceFromTeam = async (resourceIdToRemove, Team, session) => {
  if (!resourceIdToRemove) return;
  const resourceIds = typeof(resourceIdToRemove) === "object" ? { $in: resourceIdToRemove } : resourceIdToRemove;

  await Team.deleteMany({ resource: resourceIds }).session(session);
};
const removeResourceFromStream = async (
  resourceIdToRemove,
  Stream,
  session
) => {
  if (!resourceIdToRemove) return;
  const resourceIds = typeof(resourceIdToRemove) === "object" ? { $in: resourceIdToRemove } : resourceIdToRemove;

  await Stream.updateMany(
    {
      $or: [
        { "lead.resource": resourceIds },
        { "supportingLeads.resource": resourceIds },
      ],
    },
    {
      $pull: {
        lead: { resource: resourceIds },
        supportingLeads: { resource: resourceIds },
      },
    }
  ).session(session);
};
const removeResourceFromProjectByObjectIds = async (
  resourceIdToRemove,
  Project,
  projectIds,
  session
) => {
  await Project.updateMany(
    {
      _id: { $in: projectIds },
      $or: [
        { "resources.resource": resourceIdToRemove },
        { managers: resourceIdToRemove },
      ],
    },
    {
      $pull: {
        resources: { resource: resourceIdToRemove },
        managers: resourceIdToRemove,
      },
    }
  ).session(session);
};
const removeResourceFromTeamByObjectIds = async (resourceIdToRemove, Team, streamIds , session) => {
  await Team.deleteMany({ stream: { $in: streamIds }, resource: resourceIdToRemove }).session(session);
};
const removeResourceFromStreamByObjectIds = async (
  resourceIdToRemove,
  Stream,
  streamIds,
  session
) => {
await Stream.updateMany(
  {
    _id: { $in: streamIds },
    $or: [
      { "lead.resource": resourceIdToRemove },
      { "supportingLeads.resource": resourceIdToRemove },
    ],
  },
  {
    $pull: {
      lead: { resource: resourceIdToRemove },
      supportingLeads: { resource: resourceIdToRemove },
    },
  }
).session(session);
};
const addResourceToStreamsAndTeams = async (streams, resourceId, Team, Stream, session) => {
  const teamRole = process.env.team;

  await Promise.all(streams.map(async stream => {
    if(!(stream?.role) || (stream?.role === teamRole)){
      const team = new Team({
        stream: stream?.role ? stream.streamId : stream,
        resource: resourceId,
        isApproved: stream?.isApproved || false,
        approvedBy: stream?.approvedBy || null
      }); 
      await team.save({session});

    }else{
      const streamRole = `${stream.role}.resource`;
      await Stream.updateOne(
        { $and:[{_id: stream.streamId}, {[streamRole] : {$nin: [resourceId]}}] },
        {
          $addToSet: {
             [stream.role]: {
              resource: resourceId,
              isApproved: stream.isApproved,
              approvedBy: stream.approvedBy
            } 
          },
        },
        { session }
      ); 
    }
  }));
};
const addResourceToProjects = async (projects, resourceId, Role, Project, session) => {
  const { _id: managerId } = await Role.findOne({ name: process.env.manager }).select("_id");
  
  await Promise.all(projects.map(async project => {
    const roleId = project.roleId ? project.roleId : null;
    const projectId = project.projectId ? project.projectId : project;

    const update = roleId === managerId.toString() ?
    { $addToSet: { managers: resourceId } } :
    { $addToSet: { resources: { resource: resourceId, role: roleId } } };
  
    await Project.updateOne({ _id: mongoose.Types.ObjectId(projectId) }, update, { session });
  }));
};
const removeStreamFromResource = async (resourceId, streamId,Resource, session) => {
    await Resource.updateOne(
      { _id: resourceId },
      { $pull: { streams: streamId }}
      ).session(session);
};
const removeProjectFromResource = async (Resource, projectId, resourceId,session) => {
  await Resource.updateMany(
    {
      _id: resourceId
    },
    {
      $pull: { projects: projectId },
    }
  ).session(session);
};
const changeApprovedStatusOfResources = async (updates, Stream, Team, session) => {
  let teamOps = [];
  let streamOps = [];

  updates?.map(obj => {
    let streamRole;
    let isApprovedField;
    let approvedByField;

    const isApproved = obj.isApproved;
    const approvedBy = isApproved ? obj.approvedBy : null;

    if(obj.role !== TEAM){
     streamRole = `${obj.role}.resource`;
     approvedByField = `${obj.role}.$.approvedBy`;
     isApprovedField = `${obj.role}.$.isApproved`;

      streamOps.push({
        updateOne: {
          filter: { _id: mongoose.Types.ObjectId(obj.streamId), [streamRole]:  mongoose.Types.ObjectId(obj.resourceId) },
          update: { [isApprovedField]: isApproved, [approvedByField]: approvedBy }
        }
      })
    } else {
      streamRole = TEAM;
      
      teamOps.push({
        updateOne: {
          filter: { stream:  mongoose.Types.ObjectId(obj.streamId), resource:  mongoose.Types.ObjectId(obj.resourceId) },
          update: { $set:{ isApproved: isApproved, approvedBy: approvedBy} }
        }            
      })
    }          
    }
  );

  await Stream.bulkWrite(streamOps, {session});
  await Team.bulkWrite(teamOps, {session});
};
export {
    addResourceToStreamsAndTeams,
    addResourceToProjects,
    changeApprovedStatusOfResources,
    getArrayDiff,
    removeResourceFromProject,
    removeResourceFromProjectByObjectIds,
    removeResourceFromStream,
    removeResourceFromStreamByObjectIds,
    removeResourceFromTeam,
    removeResourceFromTeamByObjectIds,
    removeProjectFromResource,
    removeStreamFromResource,
};
