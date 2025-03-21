import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import ProjectUserModel, { ProjectUser } from "../models/projectUserModel";
import ProjectModel, { Project } from "../models/projectModel";
import UserModel, { MAX_USERNAME_LENGTH } from "../models/userModel";
import {
  addProjectUsersSchema,
  updateProjectUsersSchema,
  deleteProjectUsersSchema,
  userCurrentViewSchema,
  userMouseSchema,
  chatMessageSchema,
} from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, ForbiddenActionError, NotFoundError } from "../errors";
import { checkProjectAdmin, checkAdmin } from "../middleware/checkAdmin";
import { broadcast, formatQueryArray, sendMessage } from "./helpers";

// TODO: Move often-used code to helper functions (like objectIdRegex logic that's used in wsServer, or ws/http counterparts reqs with similar code, or just generally repeated code)
//       Update the delete controllers to not kick global admins when their ProjectUser is deleted (low priority)

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
        .map((projectID: string) => new mongoose.Types.ObjectId(projectID));

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
    const projectUsers: ProjectUser[] = await ProjectUserModel.find(query, { _id: 0, __v: 0 }); // use projection to avoid retrieving unnecessary fields

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
    if (!objectIdRegex.test(projectID)) throw new BadRequestError("Project ID is not a valid MongoDB ObjectId");

    // validate username
    if (username.length > MAX_USERNAME_LENGTH) throw new BadRequestError(`Username cannot exceed ${MAX_USERNAME_LENGTH} characters`);

    // query database for ProjectUser matching the projectID and username
    const projectUser: ProjectUser | null = await ProjectUserModel.findOne(
      { projectID: new mongoose.Types.ObjectId(projectID), username },
      { _id: 0, __v: 0 }
    );
    if (!projectUser) throw new NotFoundError(`No ProjectUser found for Project ID ${projectID} and Username ${username}`);

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
    if (username.length > MAX_USERNAME_LENGTH) throw new BadRequestError(`Username cannot exceed ${MAX_USERNAME_LENGTH} characters`);

    // ensure users can only accept project invitations meant for them
    if (req.username !== username) {
      throw new ForbiddenError(`User ${req.username} cannot accept a project invitation for another user (${username})`);
    }

    // validate projectID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(projectID)) throw new BadRequestError("Project ID is not a valid MongoDB ObjectId");

    // update the isAccepted property to True for the ProjectUser in the database, using the "new" flag to retrieve the updated document
    const projectUser: ProjectUser | null = await ProjectUserModel.findOneAndUpdate(
      { projectID: new mongoose.Types.ObjectId(projectID), username, isAccepted: false },
      { $set: { isAccepted: true } },
      { new: true, projection: { _id: 0, color: 0, __v: 0 } }
    );
    if (!projectUser) throw new NotFoundError(`No unaccepted ProjectUser found for Project ID ${projectID} and Username ${username}`);

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

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(
      `Cannot add ProjectUser(s) - User ${username} does not have admin privileges for Project ${projectID}`
    );
  }

  // block the request if any of the ProjectUsers it is attempting to add are not registered Users
  const registeredUserCount: number = await UserModel.countDocuments({
    username: { $in: data.map(({ username }: { username: string }) => username) },
  });
  if (data.length !== registeredUserCount) {
    throw new ForbiddenActionError("Cannot add ProjectUser that does not correspond to a registered User");
  }

  // set up transaction for batch ProjectUser insert operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // retrieve project from the database
    const project: Project | null = await ProjectModel.findOne({ _id: projectObjectId }, { __v: 0 }, { session });
    if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // block the request if it is attempting to add more ProjectUsers than the amount of available colors
    if (data.length > project.colors.length) {
      throw new ForbiddenActionError(`Cannot exceed maximum user amount for Project ${projectID}`);
    }

    // iterate over the message data and set the rest of the needed ProjectUser fields
    for (const newProjectUser of data) {
      newProjectUser.color = project.colors.pop(); // set ProjectUser's color to the next available color
      newProjectUser.isAccepted = false; // default ProjectUser to unaccepted, since they have not yet responded to their project invitation
      newProjectUser.projectID = projectObjectId;
    }

    // update project's available color array in the database
    await project.save({ session });

    // insert new ProjectUsers into database based on query object array
    const result = await ProjectUserModel.insertMany(data, { session });

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful batch ProjectUser(s) addition to the console
    console.log(`User ${username} added ${result.length} ProjectUser(s) to Project ${projectID}`);

    // broadcast ProjectUser(s) addition
    broadcast(projectID, { action: "addProjectUsers", source: username, success: true, data });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// update projectUsers (WebSocket)
export const updateProjectUsers = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(
      `Cannot update ProjectUser(s) - User ${username} does not have admin privileges for Project ${projectID}`
    );
  }

  // set up the update operations array
  const updateProjectUserOperations = data.map((projectUserUpdate: Record<string, any>) => {
    // for each ProjectUser update object in the message data, extract their username from the fields to update
    const { username: projectUserUsername, ...fieldsToUpdate } = projectUserUpdate;

    // return an updateOne operation with filter criteria for the projectID and the ProjectUser's username
    // and update criteria to set any matching fields present in the update object to their specified values
    return {
      updateOne: {
        filter: { projectID: projectObjectId, username: projectUserUsername },
        update: { $set: fieldsToUpdate },
      },
    };
  });

  // set up transaction for batch ProjectUser update operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // update ProjectUsers in database based on query object array
    const result = await ProjectUserModel.bulkWrite(updateProjectUserOperations, { session });

    // abort the transaction if the update would cause the project to have no accepted project admins
    const projectAdminCount: number = await ProjectUserModel.countDocuments(
      {
        projectID: projectObjectId,
        isProjectAdmin: true,
        isAccepted: true,
      },
      { session }
    );

    if (!projectAdminCount) throw new ForbiddenActionError(`Project ${projectID} must have at least one accepted project admin`);

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful batch ProjectUser(s) update to the console
    console.log(`User ${username} updated ${result.modifiedCount} ProjectUser(s) on Project ${projectID}`);

    // broadcast ProjectUser(s) update
    broadcast(projectID, { action: "updateProjectUsers", source: username, success: true, data });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// delete projectUsers (WebSocket)
export const deleteProjectUsers = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // check if user is attempting to delete themselves from the project as part of the batch deletion
  if (data.includes(username)) {
    // block the user from deleting themselves from the project
    throw new ForbiddenActionError(
      `Cannot delete ProjectUser(s) - User ${username} cannot delete themselves from Project ${projectID} with this request`
    );
  }

  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // block request if user is not an admin
  const isAdmin: boolean = (await checkProjectAdmin(username, projectObjectId)) || (await checkAdmin(username));
  if (!isAdmin) {
    throw new ForbiddenActionError(
      `Cannot delete ProjectUser(s) - User ${username} does not have admin privileges for Project ${projectID}`
    );
  }

  // set up transaction for batch ProjectUser deletion operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // get the ProjectUsers that will be deleted
    const projectUsers: ProjectUser[] = await ProjectUserModel.find(
      { projectID: projectObjectId, username: { $in: data } },
      { _id: 0, __v: 0 },
      { session }
    );

    if (projectUsers.length) {
      // get the colors that will be freed up when the ProjectUsers are deleted
      const colors: number[] = projectUsers.map((projectUser: ProjectUser) => projectUser.color);

      // push the freed colors to the available colors array for the project in the database
      const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
        { _id: projectObjectId },
        { $push: { colors: { $each: colors } } },
        // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
        { new: true, __v: 0, session }
      );
      if (!updatedProject) throw new NotFoundError(`No project found for ID: ${projectID}`);

      // delete the ProjectUsers from the database
      await ProjectUserModel.deleteMany({ projectID: projectObjectId, username: { $in: data } }, { session });
    }

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful batch ProjectUser(s) deletion to the console
    console.log(`User ${username} deleted ${projectUsers.length} ProjectUser(s) from Project ${projectID}`);

    // close any open WebSocket connections to the project for the deleted ProjectUsers
    // then broadcast the successful deletion to any remaining connected ProjectUsers for the project
    if (webSocketManager[projectID]) {
      for (const username of data) {
        // check if WebSocket connection exists on the project for the user
        const existingConnection: WebSocket | undefined = webSocketManager[projectID][username];
        if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
          // connection exists, close it with code 4204 for ProjectUser deletion
          existingConnection.close(4204, "User has been removed from the project");
        }
      }

      // broadcast ProjectUser(s) deletion
      broadcast(projectID, { action: "deleteProjectUsers", source: username, success: true, data });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// delete projectUser - used when a user chooses to leave a project from the project's workspace (WebSocket)
// TODO: See if any queries need to be brought down into the transaction. Also, see if you can remove the not found errors since it's a deletion.
export const deleteProjectUser = async (ws: WebSocket, projectID: string, username: string) => {
  // convert projectID string to a MongoDB ObjectId
  const projectObjectId = new mongoose.Types.ObjectId(projectID);

  // get all accepted Project Admins for the projectID
  const projectAdmins: ProjectUser[] = await ProjectUserModel.find(
    { projectID: projectObjectId, isProjectAdmin: true, isAccepted: true },
    { _id: 0, __v: 0 }
  );

  // check if user is an accepted Project Admin
  const isProjectAdmin: boolean = projectAdmins.some((projectAdmin) => projectAdmin.username === username);

  // prevent user from leaving the project if they are currently the only accepted Project Admin
  if (isProjectAdmin && projectAdmins.length === 1) {
    throw new ForbiddenActionError(
      `ProjectUser ${username} could not be deleted because they are currently the only accepted project admin on Project ${projectID}`
    );
  }

  // set up transaction for ProjectUser deletion
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // delete the ProjectUser from the database
    const projectUser: ProjectUser | null = await ProjectUserModel.findOneAndDelete(
      { projectID: projectObjectId, username },
      { projection: { _id: 0, __v: 0 }, session }
    );
    if (!projectUser) throw new NotFoundError(`No ProjectUser found for Project ID ${projectID} and Username ${username}`);

    // push the deleted ProjectUser's freed color to the available colors array for the project in the database
    const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
      { _id: projectObjectId },
      { $push: { colors: projectUser.color } },
      // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
      { new: true, __v: 0, session }
    );
    if (!updatedProject) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful ProjectUser deletion to the console
    console.log(`User ${username} has left Project ${projectID}`);

    if (ws.readyState === WebSocket.OPEN) {
      // close the WebSocket connection to the project for the user with code 4204 for ProjectUser deletion
      ws.close(4204, "User has left the project");
    }

    // broadcast the deletion
    broadcast(projectID, { action: "deleteProjectUser", source: username, success: true, data: { username } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// delete projectUser - used when a user chooses to leave a project or decline a project invitation from the user dashboard
export const deleteProjectUserHttp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get the projectID and target username from the url parameters
    const { projectID } = req.params;
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate username
    if (username.length > MAX_USERNAME_LENGTH) throw new BadRequestError(`Username cannot exceed ${MAX_USERNAME_LENGTH} characters`);

    // ensure users can only delete their own ProjectUser entry
    if (req.username !== username) throw new ForbiddenError("User cannot delete the ProjectUser entry of another user");

    // validate projectID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(projectID)) throw new BadRequestError("Project ID is not a valid MongoDB ObjectId");

    // get all accepted Project Admins for the projectID
    const projectAdmins: ProjectUser[] = await ProjectUserModel.find(
      { projectID: new mongoose.Types.ObjectId(projectID), isProjectAdmin: true, isAccepted: true },
      { _id: 0, __v: 0 }
    );

    // check if user is an accepted Project Admin
    const isProjectAdmin: boolean = projectAdmins.some((projectAdmin) => projectAdmin.username === username);

    // prevent user from leaving the project if they are currently the only accepted Project Admin
    if (isProjectAdmin && projectAdmins.length === 1) {
      throw new ForbiddenError(
        `ProjectUser ${username} could not be deleted because they are currently the only accepted project admin on Project ${projectID}`
      );
    }

    // TODO: Colors
    // delete the ProjectUser from the database
    const projectUser: ProjectUser | null = await ProjectUserModel.findOneAndDelete(
      { projectID: new mongoose.Types.ObjectId(projectID), username },
      { projection: { _id: 0, __v: 0 } }
    );
    if (!projectUser) throw new NotFoundError(`No ProjectUser found for Project ID ${projectID} and Username ${username}`);

    // log successful ProjectUser deletion to the console
    console.log(`User ${req.username} has left Project ${projectID}`);

    // check if WebSocket connection exists on the project for the user
    const existingConnection: WebSocket | undefined = webSocketManager[projectID] && webSocketManager[projectID][username];
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      // connection exists, close it with code 4204 for ProjectUser deletion
      existingConnection.close(4204, "User has left the project");
    }

    // broadcast the deletion
    broadcast(projectID, { action: "deleteProjectUser", source: username, success: true, data: { username } });

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

// User Current View (WebSocket)
export const userCurrentView = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = userCurrentViewSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // destructure necessary fields from message data
  const { trackID, targetUser } = data;

  // set up message object with the user's current view
  const userCurrentViewMessage = { action: "userCurrentView", source: username, success: true, data: { trackID } };

  // check if a target user was specified
  if (targetUser) {
    // attempt to get the target user's WebSocket
    const targetWebSocket: WebSocket | undefined = webSocketManager[projectID] && webSocketManager[projectID][targetUser];

    if (targetWebSocket) {
      // target user is connected, send them the User Current View message
      sendMessage(targetWebSocket, userCurrentViewMessage);
    }
  } else {
    // broadcast the User Current View message to all of the other connected users for the project
    broadcast(projectID, userCurrentViewMessage, ws);
  }
};

// User Mouse (WebSocket)
export const userMouse = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = userMouseSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // destructure necessary fields from message data
  const { targetUsers, ...mouseData } = data;

  // check if project currently has connected users
  if (webSocketManager[projectID]) {
    for (const targetUser of targetUsers) {
      // attempt to get each target user's WebSocket
      const targetWebSocket: WebSocket | undefined = webSocketManager[projectID][targetUser];

      if (targetWebSocket) {
        // target user is connected, send them a message with the user's mouse data
        sendMessage(targetWebSocket, { action: "userMouse", source: username, success: true, data: mouseData });
      }
    }
  }
};

// Chat Message (WebSocket)
export const chatMessage = async (_ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = chatMessageSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // broadcast the chat message to all connected users for the project
  broadcast(projectID, { action: "chatMessage", source: username, success: true, data });
};
