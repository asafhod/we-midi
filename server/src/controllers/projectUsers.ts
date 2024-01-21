import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import ProjectUserModel, { ProjectUser } from "../models/projectUserModel";
import { addProjectUsersSchema, updateProjectUsersSchema, deleteProjectUsersSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, ForbiddenActionError, NotFoundError } from "../errors";
import { formatQueryArray } from "./helpers";

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

    // respond successfully with ProjectUser data
    res.status(200).json({ success: true, data: projectUser });
  } catch (error) {
    next(error);
  }
};

// add projectUsers (WebSocket)
export const addProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = addProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the projectUsers
  ws.send(JSON.stringify({ action: "addProjectUsers", success: true, data: projectUsers }));
};

// update projectUsers (WebSocket)
export const updateProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // TODO: Don't allow user to un-Project Admin themselves if they're currently the only Project Admin

  // respond successfully with data for the projectUsers
  ws.send(JSON.stringify({ action: "updateProjectUsers", success: true, data: projectUsers }));
};

// delete projectUsers (WebSocket)
export const deleteProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the projectUsers
  ws.send(JSON.stringify({ action: "deleteProjectUsers", success: true, data: projectUsers }));
};

// delete projectUser - used when a user chooses to leave a project from the project's workspace (WebSocket)
export const deleteProjectUser = async (ws: WebSocket, projectID: string, username: string) => {
  // get all accepted project admins for the projectID
  const projectAdmins: ProjectUser[] = await ProjectUserModel.find(
    { projectID: new mongoose.Types.ObjectId(projectID), isProjectAdmin: true, isAccepted: true },
    { __v: 0 }
  );

  // check if user is a project admin
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

  // close the WebSocket connection to the project for the user
  if (ws.readyState === WebSocket.OPEN) ws.close(1000, `User ${username} has left Project ${projectID}`);

  // TODO: Broadcast a deleteProjectUser message with the username to each of the WebSocket connections for the projectID
  //       ws.send(JSON.stringify({ action: "deleteProjectUser", success: true, data: {username} })); // something like this, but on the webSocketManager
  //       Use a custom close code and logic for it in the ws close event handler to broadcast that the ProjectUser was
  //       deleted, rather than having separate broadcasts for the connection being closed and the ProjectUser deletion
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

    // get all accepted project admins for the projectID
    const projectAdmins: ProjectUser[] = await ProjectUserModel.find(
      { projectID: new mongoose.Types.ObjectId(projectID), isProjectAdmin: true, isAccepted: true },
      { __v: 0 }
    );

    // check if user is a project admin
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

    // close any open WebSocket connection to the project for the user
    const existingConnection: WebSocket | undefined = webSocketManager[projectID] && webSocketManager[projectID][username];
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      existingConnection.close(1000, `User ${req.username} has left Project ${projectID}`);
    }

    // TODO: Broadcast deletion if it wasn't handled by the existing connection closure (update it above to use the custom code)

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
