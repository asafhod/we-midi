import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import ProjectModel, { Project } from "../models/projectModel";
import ProjectUserModel, { ProjectUser } from "../models/projectUserModel";
import {
  addProjectSchema,
  updateProjectSchema,
  importMidiSchema,
  changeTempoSchema,
  updateTrackSchema,
  deleteTrackSchema,
} from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, ForbiddenActionError, NotFoundError } from "../errors";
import { SERVER_ERROR } from "../errors/errorMessages";
import { checkProjectAdmin, checkAdmin } from "../middleware/checkAdmin";
import { broadcast, sendMessage, formatQueryArray } from "./helpers";

// TODO: Move often-used code to helper functions
//       Once you change note timing to measure-based, can likely delete the changeTempo controller and use the updateProject controller for that instead as is
//       Admin only queries (low priority)?

// get projects by username
export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get aggregated data array of all projects on which the user is a member
    const projectData: {
      _id: mongoose.Types.ObjectId;
      name: string;
      isProjectAdmin: boolean;
      isAccepted: boolean;
    }[] = await ProjectUserModel.aggregate([
      {
        $match: { username: req.username },
      },
      {
        $lookup: {
          from: "projects",
          localField: "projectID",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      { $project: { _id: "$projectID", name: "$project.name", isProjectAdmin: "$isProjectAdmin", isAccepted: "$isAccepted" } },
    ]);

    // throw an error if a match could not be found in the Projects collection for every result in the ProjectUsers collection
    const projectDataMismatch: boolean = projectData.some((projectDataItem) => projectDataItem.name === undefined);
    if (projectDataMismatch) {
      throw new Error(`Could not get projects for user ${req.username} - Data mismatch between Project and ProjectUser collections`);
    }

    // respond successfully with project data
    res.status(200).json({ success: true, data: projectData });
  } catch (error) {
    next(error); // pass any thrown error to error handler middleware
  }
};

// get project by id (WebSocket)
export const getProject = async (ws: WebSocket, projectID: string) => {
  // TODO: Maybe add logic to include whether a ProjectUser/connected user is also a global Admin (low priority)
  try {
    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // get project from database using projectID
    const project = await ProjectModel.findOne(
      { _id: projectObjectId },
      { _id: 0, lastTrackID: 0, "tracks.lastNoteID": 0, __v: 0 } // use projection to avoid retrieving unnecessary fields
    );
    if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // get ProjectUsers from database using projectID
    const projectUsers = await ProjectUserModel.find({ projectID: projectObjectId }, { projectID: 0, __v: 0 });
    if (!projectUsers.length) throw new Error(`No ProjectUsers found for Project ID: ${projectID}`);

    // verify project's connections object exists
    if (!webSocketManager[projectID]) throw new Error(`No project connections object found for Project ID: ${projectID}`);

    // get usernames of the clients currently connected to the project
    const connectedUsers: string[] = Object.keys(webSocketManager[projectID]);

    // verify that connected users exists for the project (at least one should, because a connected user is making this request)
    if (!connectedUsers.length) throw new Error(`No connections found for Project ID: ${projectID}`);

    // respond successfully with project data
    sendMessage(ws, { action: "getProject", success: true, data: { project, projectUsers, connectedUsers } });
  } catch (error) {
    // project could not be retrieved for the client, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);
    console.error(`Action: getProject\nError: Could not get project - ${error}`);
  }
};

// add project
export const addProject = async (req: Request, res: Response, next: NextFunction) => {
  // validate request body with Joi schema
  const { error } = addProjectSchema.validate(req.body, { abortEarly: false });
  if (error) throw new BadRequestError(String(error));

  // set up transaction for Project creation operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // create new project in the database based on json in request body and destructure its _id
    const { _id }: Project = (await ProjectModel.create(req.body, { new: true, session }))[0];

    // create new ProjectUser in the database for the user on the new project, setting them as an accepted Project Admin
    await ProjectUserModel.create(
      {
        projectID: _id,
        username: req.username,
        isProjectAdmin: true,
        isAccepted: true,
      },
      { session }
    );

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful project creation to the console
    console.log(`User ${req.username} created project: ${_id.toString()}`);

    // respond successfully with the project's _id
    res.status(201).json({ success: true, data: { _id } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// update project (WebSocket)
export const updateProject = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(`Cannot update project - User ${username} does not have admin privileges for Project ${projectID}`);
  }

  // update project in the database based on message data, using "new" flag to retrieve the updated document
  const project: Project | null = await ProjectModel.findOneAndUpdate(
    { _id: projectObjectId },
    { $set: data },
    { new: true, projection: { __v: 0 } }
  );
  if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // log successful project update to the console
  console.log(`User ${username} updated project: ${projectID}`);

  // broadcast project update
  broadcast(projectID, { action: "updateProject", success: true, data });
};

// import MIDI (WebSocket)
export const importMidi = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = importMidiSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // TODO: Which data gets sent back (same question for similar project-editing controllers)?
  // respond successfully with project data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "importMidi", success: true, data: project }));
};

// change tempo (WebSocket)
export const changeTempo = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = changeTempoSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with project data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "changeTempo", success: true, data: project }));
};

// add track (WebSocket)
export const addTrack = async (ws: WebSocket, projectID: string, username: string) => {
  // respond successfully with project data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "addTrack", success: true, data: project }));
};

// update track (WebSocket)
export const updateTrack = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateTrackSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with project data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "updateTrack", success: true, data: project }));
};

// delete track (WebSocket)
export const deleteTrack = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteTrackSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with project data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "deleteTrack", success: true, data: project }));
};

// delete project - used when deleting a project from the project's workspace (WebSocket)
export const deleteProject = async (_ws: WebSocket, projectID: string, username: string) => {
  // convert project ID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(`Cannot delete project - User ${username} does not have admin privileges for Project ${projectID}`);
  }

  // set up transaction for Project deletion operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // TODO: Delete all ProjectUsers for the project. Don't forget to include the session flag.

    // delete project from the database
    const project: Project | null = await ProjectModel.findOneAndDelete({ _id: projectObjectId }, { projection: { __v: 0 }, session });
    if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful project deletion to the console
    console.log(`User ${username} deleted project: ${projectID}`);

    // TODO: Close all WS clients currently working on the project with code 1000 and reason "Project was deleted"
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// delete project - used when deleting a project from the user dashboard
export const deleteProjectHttp = async (req: Request, res: Response, next: NextFunction) => {
  // get project's ID from url parameter
  const { id } = req.params;

  // validate project ID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
  const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) throw new BadRequestError("ProjectID is not a valid MongoDB ObjectId");

  // convert project ID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(id);

  // verify username exists on request
  if (!req.username) throw new Error("Cannot delete project - Username is missing from request");

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(req.username, projectObjectId)) || (await checkAdmin(req.username));
  if (!isAdmin) {
    throw new ForbiddenError(`Cannot delete project - User ${req.username} does not have admin privileges for Project ${id}`);
  }

  // set up transaction for Project deletion operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // TODO: Delete all ProjectUsers for the project. Don't forget to include the session flag.

    // delete project from the database
    const project: Project | null = await ProjectModel.findOneAndDelete({ _id: projectObjectId }, { projection: { __v: 0 }, session });
    if (!project) throw new NotFoundError(`No project found for ID: ${id}`);

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful project deletion to the console
    console.log(`User ${req.username} deleted project: ${id}`);

    // TODO: Close all WS clients currently working on the project with code 1000 and reason "Project was deleted"

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
