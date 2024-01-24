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
import { BadRequestError, BadMessageError, NotFoundError } from "../errors";
import { SERVER_ERROR } from "../errors/errorMessages";
import { broadcast, sendMessage, formatQueryArray } from "./helpers";

// TODO: Admin only queries (low priority)?

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
// TODO: AddProjectUser schema was unnecessary. Include that as part of this Add Project controller.
//       projectID would be given by the db, username would be on the request from the Cognito token auth, isProjectAdmin would be True
export const addProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate request body with Joi schema
    const { error } = addProjectSchema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    // insert new project into database based on json in request body
    const project = await ProjectModel.create(req.body);

    // log successful project addition to the console
    console.log(`User ${req.username} added project: ${req.body.id}`);

    // respond successfully with project data
    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        names: project.names,
        languages: project.languages,
        regions: project.regions,
        orgs: project.orgs,
        population: project.population,
        gdp: project.gdp,
      },
    });
  } catch (error) {
    next(error);
  }
};

// update project (WebSocket)
export const updateProject = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // update project matching projectID in the database based on data, using "new" flag to retrieve the updated entry
  const project = await ProjectModel.findOneAndUpdate({ _id: projectID.toLowerCase() }, data, { new: true, projection: { __v: 0 } });
  if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // log successful project update to the console
  console.log(`User ${username} updated project: ${projectID}`);

  // respond successfully with project data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "updateProject", success: true, data: project }));
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
export const deleteProject = async (ws: WebSocket, projectID: string, username: string) => {
  // TODO: Implement
  // TODO: Close all WS clients currently working on the project
};

// delete project - used when deleting a project from the user dashboard
export const deleteProjectHttp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // delete project matching id parameter in database
    const project = await ProjectModel.findOneAndDelete({ _id: id.toLowerCase() }, { projection: { __v: 0 } });
    if (!project) throw new NotFoundError(`No project found for ID: ${id}`);

    // log successful project deletion to the console
    console.log(`User ${req.username} deleted project: ${id}`);

    // respond successfully
    res.sendStatus(204);

    // TODO: Close all WS clients currently working on the project
  } catch (error) {
    next(error);
  }
};
