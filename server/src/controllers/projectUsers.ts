import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import ProjectUserModel, { ProjectUser } from "../models/projectUserModel";
import { addProjectUsersSchema, updateProjectUsersSchema, deleteProjectUsersSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, ForbiddenActionError, NotFoundError } from "../errors";
import { checkProjectAdmin, checkAdmin } from "../middleware/checkAdmin";
import { broadcast, formatQueryArray } from "./helpers";

// TODO: Update the delete controllers to not kick global admins when their ProjectUser is deleted (low priority)

// get ProjectUsers based on url query arguments (admin only)
export const getProjectUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure url query arguments from request
    const { projectIDs, usernames, isProjectAdmin, isAccepted } = req.query;

    // initialize query to empty object
    const query: Record<string, any> = {};

    // set up query object for arguments that correspond to array fields on the ProjectUser model
    if (projectIDs) {
      // split projectIDs string argument string into array and map each entry to a MongoDB ObjectId
      const projectIDsArray: mongoose.Types.ObjectId[] = (projectIDs as string)
        .split(",")
        .map((projectID) => new mongoose.Types.ObjectId(projectID));

      // set a query field for the projectID argument with the "$in" property to allow querying based on all of the projectIDs array entries
      query.projectID = { $in: projectIDsArray };
    }

    if (usernames) {
      // format usernames string argument into array
      const usernamesArray: RegExp[] = formatQueryArray(usernames as string);
      // set a query field for the username argument with the "$in" property to allow querying based on all of the usernames array entries
      query.username = { $in: usernamesArray };
    }

    // set up query object for arguments that correspond to non-array fields on ProjectUser model
    if (isProjectAdmin) {
      // cast string argument to boolean and set it as a query field
      query.isProjectAdmin = isProjectAdmin === "true";
    }

    if (isAccepted) {
      query.isAccepted = isAccepted === "true";
    }

    // query the database using the query object (an empty object returns all ProjectUsers)
    const projectUsers: ProjectUser[] = await ProjectUserModel.find(query, { __v: 0 }); // use projection to avoid retrieving unnecessary field __v

    // respond successfully with ProjectUser data
    res.status(200).json({ success: true, data: projectUsers });
  } catch (error) {
    next(error); // pass any thrown error to error handler middleware
  }
};

// get ProjectUser by projectID and username (admin only)
export const getProjectUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get the projectID and target username from the url parameters
    const { projectID } = req.params;
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate projectID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(projectID)) throw new BadRequestError("ProjectID is not a valid MongoDB ObjectId");

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // query database for ProjectUser matching the projectID and username
    const projectUser: ProjectUser | null = await ProjectUserModel.findOne(
      { projectID: new mongoose.Types.ObjectId(projectID), username },
      { __v: 0 }
    );
    if (!projectUser) throw new NotFoundError(`No ProjectUser found for projectID ${projectID} and username ${username}`);

    // respond successfully with ProjectUser data
    res.status(200).json({ success: true, data: projectUser });
  } catch (error) {
    next(error);
  }
};

// update ProjectUser and set its isAccepted property to True when a user accepts a project invitation
export const acceptProjectUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get the projectID and target username from the url parameters
    const { projectID } = req.params;
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // ensure users can only accept project invitations meant for them
    if (req.username !== username) throw new ForbiddenError("User cannot accept a project invitation for another user");

    // validate projectID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(projectID)) throw new BadRequestError("ProjectID is not a valid MongoDB ObjectId");

    // update the isAccepted property to True for the ProjectUser in the database, using the "new" flag to retrieve the updated entry
    const projectUser: ProjectUser | null = await ProjectUserModel.findOneAndUpdate(
      { projectID: new mongoose.Types.ObjectId(projectID), username, isAccepted: false },
      { $set: { isAccepted: true } },
      { new: true, projection: { __v: 0 } }
    );
    if (!projectUser) throw new NotFoundError(`No unaccepted ProjectUser found for projectID ${projectID} and username ${username}`);

    // log successful ProjectUser update to the console
    console.log(`User ${req.username} has accepted their invitation to Project ${projectID}`);

    // broadcast that the user accepted the project invitation
    broadcast(projectID, { action: "acceptProjectUser", success: true, data: { username } });

    // respond successfully with ProjectUser data
    res.status(200).json({ success: true, data: projectUser });
  } catch (error) {
    next(error);
  }
};

// add projectUsers (WebSocket)
export const addProjectUsers = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = addProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // check that user making the request is an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectID)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(
      `Cannot add ProjectUsers - User ${username} does not have admin privileges for Project ${projectID}`
    );
  }

  // TODO: Probably better to not use checkProjectAdmin here so you can avoid querying the db twice
  //       Just change the countDocuments to retrieve them instead, check if accepted projectAdmin,
  //       then do the checkAdmin and count checks

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block the request if adding the new ProjectUsers will increase the total ProjectUser count for the project past the cap
  const existingProjectUserCount: number = await ProjectUserModel.countDocuments({ projectID: projectObjectId });
  const newProjectUserCount: number = data.length;
  if (existingProjectUserCount + newProjectUserCount > 10) throw new ForbiddenActionError("Cannot exceed max user amount for project");

  // map message data to query object array with all the needed ProjectUser fields
  const addProjectUsersQuery = data.map((projectUser: { username: string; isProjectAdmin?: boolean }) => {
    const isProjectAdmin: boolean = projectUser.isProjectAdmin === true; // convert to boolean in case it's undefined

    return { projectID: projectObjectId, username: projectUser.username, isProjectAdmin, isAccepted: false };
  });

  // set up transaction for batch ProjectUser insert operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // insert new ProjectUsers into database based on query object array
    const result = await ProjectUserModel.insertMany(addProjectUsersQuery, { session });

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful batch ProjectUser addition to the console
    console.log(`User ${username} added ${result.length} ProjectUser(s) to Project ${projectID}`);

    // broadcast ProjectUser(s) addition
    broadcast(projectID, { action: "addProjectUsers", success: true, data });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// update projectUsers (WebSocket)
export const updateProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // TODO: Don't allow user to un-Project Admin themselves if they're currently the only Project Admin, including as part of batch

  // respond successfully with data for the projectUsers
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "updateProjectUsers", success: true, data: projectUsers }));
};

// delete projectUsers (WebSocket)
export const deleteProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // TODO: Don't allow user to delete their own ProjectUser with this request

  // respond successfully with data for the projectUsers
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "deleteProjectUsers", success: true, data: projectUsers }));
};

// delete projectUser - used when a user chooses to leave a project from the project's workspace (WebSocket)
export const deleteProjectUser = async (ws: WebSocket, projectID: string, username: string) => {
  // get all accepted Project Admins for the projectID
  const projectAdmins: ProjectUser[] = await ProjectUserModel.find(
    { projectID: new mongoose.Types.ObjectId(projectID), isProjectAdmin: true, isAccepted: true },
    { __v: 0 }
  );

  // check if user is an accepted Project Admin
  const isProjectAdmin: boolean = projectAdmins.some((projectAdmin) => projectAdmin.username === username);

  // prevent user from leaving the project if they are currently the only accepted Project Admin
  if (isProjectAdmin && projectAdmins.length === 1) {
    throw new ForbiddenActionError(
      `ProjectUser ${username} could not be deleted because they are currently the only accepted project admin on Project ${projectID}`
    );
  }

  // delete the ProjectUser from the database
  const projectUser: ProjectUser | null = await ProjectUserModel.findOneAndDelete(
    { projectID: new mongoose.Types.ObjectId(projectID), username },
    { projection: { __v: 0 } }
  );
  if (!projectUser) throw new NotFoundError(`No ProjectUser found for projectID ${projectID} and username ${username}`);

  // log successful ProjectUser deletion to the console
  console.log(`User ${username} has left Project ${projectID}`);

  if (ws.readyState === WebSocket.OPEN) {
    // close the WebSocket connection to the project for the user with code 4204 for ProjectUser deletion
    // deletion broadcast is handled by the WebSocket connection close event logic
    ws.close(4204, `User ${username} has left Project ${projectID}`);
  } else {
    // user is no longer connected, broadcast the deletion
    broadcast(projectID, { action: "deleteProjectUser", success: true, data: { username } });
  }
};

// delete projectUser - used when a user chooses to leave a project or decline a project invitation from the user dashboard
export const deleteProjectUserHttp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get the projectID and target username from the url parameters
    const { projectID } = req.params;
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // ensure users can only delete their own ProjectUser entry
    if (req.username !== username) throw new ForbiddenError("User cannot delete the ProjectUser entry of another user");

    // validate projectID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(projectID)) throw new BadRequestError("ProjectID is not a valid MongoDB ObjectId");

    // get all accepted Project Admins for the projectID
    const projectAdmins: ProjectUser[] = await ProjectUserModel.find(
      { projectID: new mongoose.Types.ObjectId(projectID), isProjectAdmin: true, isAccepted: true },
      { __v: 0 }
    );

    // check if user is an accepted Project Admin
    const isProjectAdmin: boolean = projectAdmins.some((projectAdmin) => projectAdmin.username === username);

    // prevent user from leaving the project if they are currently the only accepted Project Admin
    if (isProjectAdmin && projectAdmins.length === 1) {
      throw new ForbiddenError(
        `ProjectUser ${username} could not be deleted because they are currently the only accepted project admin on Project ${projectID}`
      );
    }

    // delete the ProjectUser from the database
    const projectUser: ProjectUser | null = await ProjectUserModel.findOneAndDelete(
      { projectID: new mongoose.Types.ObjectId(projectID), username },
      { projection: { __v: 0 } }
    );
    if (!projectUser) throw new NotFoundError(`No ProjectUser found for projectID ${projectID} and username ${username}`);

    // log successful ProjectUser deletion to the console
    console.log(`User ${req.username} has left Project ${projectID}`);

    // check if WebSocket connection exists on the project for the user
    const existingConnection: WebSocket | undefined = webSocketManager[projectID] && webSocketManager[projectID][username];
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      // Connection exists, close it with code 4204 for ProjectUser deletion. Deletion broadcast is handled by the WebSocket connection close event logic.
      existingConnection.close(4204, `User ${req.username} has left Project ${projectID}`);
    } else {
      // user is not currently connected, broadcast the deletion
      broadcast(projectID, { action: "deleteProjectUser", success: true, data: { username } });
    }

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
