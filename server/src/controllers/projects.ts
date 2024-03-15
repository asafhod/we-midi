import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import ProjectModel, { Project, Track, Note, DEFAULT_PPQ, DEFAULT_VOLUME } from "../models/projectModel";
import ProjectUserModel from "../models/projectUserModel";
import { addProjectSchema, updateProjectSchema, importMidiSchema, updateTrackSchema, deleteTrackSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, ForbiddenActionError, NotFoundError } from "../errors";
import { SERVER_ERROR } from "../errors/errorMessages";
import { checkProjectAdmin, checkAdmin } from "../middleware/checkAdmin";
import { broadcast, sendMessage } from "./helpers";

// TODO: Move often-used code to helper functions
//       Once you change note timing to measure-based, simplify the tempo logic in the updateProject controller
//         Would just set the tempo like any other field update (wouldn't need to change notes)
//       Admin-only GET queries for data access/monitoring (low priority)

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
      throw new Error(`Could not get projects for User ${req.username} - Data mismatch between Project and ProjectUser collections`);
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
      { _id: 0, lastTrackID: 0, "tracks.lastNoteID": 0, "tracks._id": 0, "tracks.notes._id": 0, __v: 0 } // use projection to avoid retrieving unnecessary fields
    );
    if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // get ProjectUsers from database using projectID
    const projectUsers: any[] = await ProjectUserModel.find({ projectID: projectObjectId }, { _id: 0, projectID: 0, __v: 0 }).lean();
    if (!projectUsers.length) throw new Error(`No ProjectUsers found for Project ID: ${projectID}`);

    // verify project's connections object exists
    if (!webSocketManager[projectID]) throw new Error(`No project connections object found for Project ID: ${projectID}`);

    // get usernames of the clients currently connected to the project
    const connectedUsers: string[] = Object.keys(webSocketManager[projectID]);

    // verify that connected users exists for the project (at least one should, because a connected user is making this request)
    if (!connectedUsers.length) throw new Error(`No connections found for Project ID: ${projectID}`);

    for (const connectedUser of connectedUsers) {
      // iterate over the connected users for the project and find their associated ProjectUser
      const projectUser = projectUsers.find((projectUser) => projectUser.username === connectedUser);

      if (projectUser) {
        // mark the ProjectUser as online
        projectUser.isOnline = true;
      } else {
        // if a connected user does not have an associated ProjectUser, mark them as online but not a member (can happen with global admins, or possibly with timing edge cases)
        projectUsers.push({ username: connectedUser, isProjectAdmin: false, isAccepted: false, isOnline: true, isNotMember: true });
      }
    }

    // respond successfully with project data
    sendMessage(ws, { action: "getProject", success: true, data: { project, projectUsers } });
  } catch (error) {
    // project could not be retrieved for the client, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);

    // log error to console
    console.error(`Action: getProject ${error}`);
  }
};

// add project
export const addProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate request body with Joi schema
    const { error } = addProjectSchema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    // set up transaction for Project creation operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // create new project in the database based on json in request body and destructure its _id
      const { _id }: Project = (await ProjectModel.create([req.body], { new: true, session }))[0];

      // create new ProjectUser in the database for the user on the new project, setting them as an accepted Project Admin
      await ProjectUserModel.create(
        [
          {
            projectID: _id,
            username: req.username,
            isProjectAdmin: true,
            isAccepted: true,
          },
        ],
        { session }
      );

      // if successful, commit and end the transaction
      await session.commitTransaction();
      session.endSession();

      // log successful project creation to the console
      console.log(`User ${req.username} created Project ${_id.toString()}`);

      // respond successfully with the project's _id
      res.status(201).json({ success: true, data: { _id } });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// update project (WebSocket)
// TODO: Likely need a loading screen for the client making the request if they're changing tempo
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

  if (data.tempo) {
    // get current project tempo and tracks from the database using projectID
    const projectData = await ProjectModel.findOne(
      { _id: projectObjectId },
      { _id: 0, __v: 0, name: 0, ppq: 0, lastTrackID: 0, "tracks._id": 0, "tracks.notes._id": 0 }
    ).lean();

    if (!projectData) throw new NotFoundError(`No project found for ID: ${projectID}`);

    if (data.tempo !== projectData.tempo && projectData.tracks.length) {
      // Update is attempting to change the song's tempo. Adjust the notes accordingly.
      const tempoConversionFactor: number = projectData.tempo / data.tempo;

      data.tracks = projectData.tracks.map((track: Track) => {
        const newNotes: Note[] = track.notes.map((note: Note) => {
          const newDuration: number = note.duration * tempoConversionFactor;
          const newNoteTime: number = note.noteTime * tempoConversionFactor;

          return { ...note, duration: newDuration, noteTime: newNoteTime };
        });

        return { ...track, notes: newNotes };
      });
    }
  }

  // update project in the database based on the project update data
  const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
    { _id: projectObjectId },
    { $set: data },
    // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
    { new: true, __v: 0 }
  );
  if (!updatedProject) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // log successful project update to the console
  console.log(`User ${username} updated Project ${projectID}`);

  if (data.tracks) {
    // map tracks data to remove unnecessary fields prior to broadcasting
    data.tracks = data.tracks.map((track: Track) => ({ trackID: track.trackID, notes: track.notes }));
  }

  // broadcast project update
  broadcast(projectID, { action: "updateProject", source: username, success: true, data });
};

// import MIDI (WebSocket)
// TODO: Likely need a loading screen for the client making the request
export const importMidi = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = importMidiSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(`Cannot import MIDI - User ${username} does not have admin privileges for Project ${projectID}`);
  }

  // get project's current lastTrackID value from the database using projectID
  const projectData = await ProjectModel.findOne({ _id: projectObjectId }, { lastTrackID: 1 });
  if (!projectData) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // set lastTrackID in the project update data to the database's current lastTrackID plus the amount of tracks being imported
  data.lastTrackID = data.tracks.length + projectData.lastTrackID;

  // set the trackID for each track being imported by incrementing from the database's current lastTrackID
  for (let i = 0; i < data.tracks.length; i++) {
    data.tracks[i].trackID = projectData.lastTrackID + i + 1;
  }

  // update project in the database based on the project update data
  const updatedProject = await ProjectModel.findOneAndUpdate(
    { _id: projectObjectId },
    { $set: data },
    // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
    {
      new: true,
      projection: { _id: 0, name: 0, lastTrackID: 0, "tracks.lastNoteID": 0, "tracks._id": 0, "tracks.notes._id": 0, __v: 0 },
    }
  );
  if (!updatedProject) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // log successful MIDI import to the console
  console.log(`User ${username} imported MIDI data for Project ${projectID}`);

  // broadcast MIDI import
  broadcast(projectID, { action: "importMidi", source: username, success: true, data: updatedProject });
};

// add track (WebSocket)
export const addTrack = async (_ws: WebSocket, projectID: string, username: string) => {
  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(`Cannot add track - User ${username} does not have admin privileges for Project ${projectID}`);
  }

  // get project's current lastTrackID value from the database using projectID
  const projectData = await ProjectModel.findOne({ _id: projectObjectId }, { lastTrackID: 1 });
  if (!projectData) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // calculate new track's ID by incrementing the current lastTrackID by 1
  const newTrackID: number = projectData.lastTrackID + 1;

  // set up the new track object
  const newTrack: Track = {
    trackID: newTrackID,
    trackName: `Track ${newTrackID}`,
    instrument: "p", // TODO: Make sure client sends instrument codes
    volume: DEFAULT_VOLUME,
    pan: 0,
    solo: false,
    mute: false,
    lastNoteID: 0,
    notes: [],
  };

  // push the new track to the tracks array for the project in the database and set the new lastTrackID
  const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
    { _id: projectObjectId },
    { $set: { lastTrackID: newTrackID }, $push: { tracks: newTrack } },
    // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
    { new: true, __v: 0 }
  );
  if (!updatedProject) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // log successful track addition to the console
  console.log(`User ${username} added a new track to Project ${projectID}`);

  // broadcast track addition
  broadcast(projectID, { action: "addTrack", source: username, success: true, data: { trackID: newTrackID } });
};

// update track (WebSocket)
export const updateTrack = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  try {
    // validate data with Joi schema
    const { error } = updateTrackSchema.validate(data, { abortEarly: false });
    if (error) throw new BadMessageError(String(error));

    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // block request if user is not an admin
    const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
    if (!isAdmin) {
      throw new ForbiddenActionError(`Cannot update track - User ${username} does not have admin privileges for Project ${projectID}`);
    }

    // destructure message data to separate trackID from the fields to be updated
    const { trackID, ...updateFields } = data;

    // set up update query object
    const trackUpdate: Record<string, any> = {};

    for (const [key, value] of Object.entries(updateFields)) {
      // prepend "tracks.$." to each field so update query can target the matching track from the filter object
      trackUpdate[`tracks.$.${key}`] = value;
    }

    // update the specified track in the tracks array for the project in the database
    const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
      { _id: projectObjectId, "tracks.trackID": trackID },
      { $set: trackUpdate },
      // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
      { new: true, __v: 0 }
    );

    if (updatedProject) {
      // log successful track update to the console
      console.log(`User ${username} updated Track ${trackID} on Project ${projectID}`);

      // broadcast track update to all users currently connected to the project
      broadcast(projectID, { action: "updateTrack", source: username, success: true, data });
    }
  } catch (error) {
    // track cannot be updated or rolled back due to a database error, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);
    console.error(`Action: updateTrack ${error}`);
  }
};

// delete track (WebSocket)
export const deleteTrack = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteTrackSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(`Cannot delete track - User ${username} does not have admin privileges for Project ${projectID}`);
  }

  // set up transaction for track deletion operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // delete the specified track from the tracks array for the project in the database
    const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
      { _id: projectObjectId },
      { $pull: { tracks: { trackID: data.trackID } } },
      // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
      { new: true, __v: 0, session }
    );
    if (!updatedProject) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // if last remaining track was deleted and PPQ is not the default value, reset it to the default value (in case a MIDI import changed it)
    if (!updatedProject.tracks.length && updatedProject.ppq !== DEFAULT_PPQ) {
      updatedProject.ppq = DEFAULT_PPQ;
      await updatedProject.save({ session });
    }

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful track deletion to the console
    console.log(`User ${username} deleted Track ${data.trackID} from Project ${projectID}`);

    // broadcast track deletion
    broadcast(projectID, { action: "deleteTrack", source: username, success: true, data });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
    // delete all ProjectUsers for the project from the database
    await ProjectUserModel.deleteMany({ projectID: projectObjectId }, { session });

    // delete project from the database
    const project: Project | null = await ProjectModel.findOneAndDelete({ _id: projectObjectId }, { projection: { __v: 0 }, session });
    if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful project deletion to the console
    console.log(`User ${username} deleted Project ${projectID}`);

    // check if project currently has user connections, if so close them
    if (webSocketManager[projectID]) {
      for (const connection of Object.values(webSocketManager[projectID])) {
        // close any open connections with code 4204
        // this code indicates ProjectUser deletion and prevents the connection closures from being needlessly broadcast to each other, since they are all being closed
        if (connection.readyState === WebSocket.OPEN) connection.close(4204, "Project was deleted");
      }
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// delete project - used when deleting a project from the user dashboard
export const deleteProjectHttp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get project's ID from url parameter
    const { id } = req.params;

    // validate project ID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) throw new BadRequestError("Project ID is not a valid MongoDB ObjectId");

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
      // delete all ProjectUsers for the project from the database
      await ProjectUserModel.deleteMany({ projectID: projectObjectId }, { session });

      // delete project from the database
      const project: Project | null = await ProjectModel.findOneAndDelete(
        { _id: projectObjectId },
        { projection: { __v: 0 }, session }
      );
      if (!project) throw new NotFoundError(`No project found for ID: ${id}`);

      // if successful, commit and end the transaction
      await session.commitTransaction();
      session.endSession();

      // log successful project deletion to the console
      console.log(`User ${req.username} deleted Project ${id}`);

      // check if project currently has user connections, if so close them
      if (webSocketManager[id]) {
        for (const connection of Object.values(webSocketManager[id])) {
          // close any open connections with code 4204
          // this code indicates ProjectUser deletion and prevents the connection closures from being needlessly broadcast to each other, since they are all being closed
          if (connection.readyState === WebSocket.OPEN) connection.close(4204, "Project was deleted");
        }
      }

      // respond successfully
      res.sendStatus(204);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
