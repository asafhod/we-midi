import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import UserModel, { User } from "../models/userModel";
import ProjectUserModel, { ProjectUser } from "../models/projectUserModel";
import { updateUserSchema, searchUsersSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, NotFoundError } from "../errors";
import { broadcast, sendMessage, formatQueryArray } from "./helpers";

// TODO: Make sure deleteUser has Cognito permissions to delete a user and that it's secure (as in people can't do it from the browser client)
//       Confirm leaving out __v using the projection is necessary. Probably is.

// get users based on url query arguments (admin only)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure url query arguments from request
    const { usernames, isAdmin } = req.query;

    // initialize query to empty object
    const query: Record<string, any> = {};

    if (usernames) {
      // format usernames string into array
      const usernamesArray: RegExp[] = formatQueryArray(usernames as string);
      // set query field for username with the "$in" property to allow querying based on all of the entries in the usernames array
      query.username = { $in: usernamesArray };
    }

    if (isAdmin) {
      // cast isAdmin string argument to boolean
      query.isAdmin = isAdmin === "true";
    }

    // query the database using the query object (an empty object returns all users)
    const users: User[] = await UserModel.find(query, { __v: 0 }); // use projection to avoid retrieving unnecessary field __v

    // respond successfully with user data
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error); // pass any thrown error to error handler middleware
  }
};

// get user by username (admin only)
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get target username from url parameter
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // query database for user matching username
    const user: User | null = await UserModel.findOne({ username }, { __v: 0 });
    if (!user) throw new NotFoundError(`No user found for username: ${username}`);

    // respond successfully with user data
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// search users (WebSocket)
// TODO: On client, hide any users that are already ProjectUsers on the project from the result set (user making the request already won't be in it, though logic would be the same)
export const searchUsers = async (ws: WebSocket, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = searchUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // query database for first 25 users whose username begins with the search string, excluding the user making the request
  const users: User[] = await UserModel.find(
    { username: { $regex: new RegExp(`^${data.search}`, "i"), $ne: username } },
    { __v: 0 }
  ).limit(25);

  // respond successfully with user data
  sendMessage(ws, { action: "searchUsers", success: true, data: users });
};

// update user (admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  // validate request body with Joi schema
  const { error } = updateUserSchema.validate(req.body, { abortEarly: false });
  if (error) throw new BadRequestError(String(error));

  // get target username from url parameter
  const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

  // validate username
  if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

  // set up transaction for update operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // update the user in the database based on request body, using "new" flag to retrieve the updated document
    const user: User | null = await UserModel.findOneAndUpdate(
      { username },
      { $set: req.body },
      { new: true, projection: { __v: 0 }, session }
    );
    if (!user) throw new NotFoundError(`No user found for username: ${username}`);

    // set up Cognito Identity Service Provider
    const cognito = new CognitoIdentityServiceProvider();

    // retrieve and validate AWS User Pool ID environment variable
    const { AWS_USER_POOL_ID } = process.env;
    if (!AWS_USER_POOL_ID) throw new Error("Environment variable AWS_USER_POOL_ID is required");

    // map user properties from the request body to Cognito user attribute object array
    const userAttributes: { Name: string; Value: any }[] = Object.entries(req.body).map(([key, value]) => ({
      Name: `custom:${key}`,
      Value: typeof value === "boolean" ? Number(value) : value,
    }));

    // update matching Cognito custom attributes
    await cognito
      .adminUpdateUserAttributes({ UserAttributes: userAttributes, UserPoolId: AWS_USER_POOL_ID, Username: username })
      .promise();

    // both updates were successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful user update to the console
    console.log(`User ${req.username} updated user: ${username}`);

    // if user lost Admin status, close any open WebSocket connections of theirs for the projects they are not members of
    if (req.body.isAdmin !== undefined && req.body.isAdmin !== null && !req.body.isAdmin) {
      const memberProjects: ProjectUser[] = await ProjectUserModel.find({ username, isAccepted: true }, { __v: 0 });
      // map to string array
      const memberProjectIDs: string[] = memberProjects.map((memberProject) => memberProject.projectID.toString());

      for (const [projectID, projectConnections] of Object.entries(webSocketManager)) {
        if (!memberProjectIDs.includes(projectID)) {
          // user is not a member of this project, close any existing connection
          const existingConnection: WebSocket | undefined = projectConnections[username];
          if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
            existingConnection.close(1000, "User has lost admin permissions and can no longer access the project");
          }
        }
      }
    }

    // respond successfully with user data
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// delete user (admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  // get target username from url parameter
  const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

  // validate username
  if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

  // prevent user from deleting themselves
  if (req.username === username) throw new ForbiddenError(`User ${username} cannot delete themselves`);

  // get all projects where user is a member
  const memberProjects: ProjectUser[] = await ProjectUserModel.find({ username }, { __v: 0 });

  // get projectIDs for all projects where user is a Project Admin and accepted
  const adminProjectIDs: mongoose.Types.ObjectId[] = memberProjects
    .filter((project) => project.isProjectAdmin && project.isAccepted)
    .map((adminProject) => adminProject.projectID);

  // get any projects for which user is currently the only accepted Project Admin
  const onlyAdminProjects = await ProjectUserModel.aggregate([
    { $match: { projectID: { $in: adminProjectIDs }, isProjectAdmin: true, isAccepted: true } },
    { $group: { _id: "$projectID", count: { $sum: 1 } } },
    { $match: { count: 1 } },
  ]);

  if (onlyAdminProjects.length) {
    // user is currently the only accepted Project Admin on at least one project, prevent deletion
    const onlyAdminProjectIDs: string[] = onlyAdminProjects.map((onlyAdminProject) => onlyAdminProject._id.toString()); // map projectIDs to string array
    throw new ForbiddenError(
      `User ${username} could not be deleted because they are currently the only accepted project admin for Projects: ${onlyAdminProjectIDs.join(
        ", "
      )}`
    );
  }

  // set up transaction for delete operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // delete the user's entries from the ProjectUser database
    const projectUserDeleteResult = await ProjectUserModel.deleteMany({ username }, { session });

    // delete the user from the User database
    const user: User | null = await UserModel.findOneAndDelete({ username }, { projection: { __v: 0 }, session });
    if (!user) throw new NotFoundError(`No user found for username: ${username}`);

    // set up Cognito Identity Service Provider
    const cognito = new CognitoIdentityServiceProvider();

    // retrieve and validate AWS User Pool ID environment variable
    const { AWS_USER_POOL_ID } = process.env;
    if (!AWS_USER_POOL_ID) throw new Error("Environment variable AWS_USER_POOL_ID is required");

    // delete the user from Cognito
    await cognito.adminDeleteUser({ UserPoolId: AWS_USER_POOL_ID, Username: username }).promise();

    // all delete operations were successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful user deletion to the console
    console.log(
      `User ${req.username} deleted user: ${username}\nThe user was removed from ${projectUserDeleteResult.deletedCount} projects`
    );

    // close any open WebSocket connection for the user
    for (const projectConnections of Object.values(webSocketManager)) {
      const existingConnection: WebSocket | undefined = projectConnections[username];
      if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
        existingConnection.close(1000, "User has been deleted");
      }
    }

    // broadcast the ProjectUser deletion to any projects on which the user was a member
    for (const memberProject of memberProjects) {
      broadcast(memberProject.projectID.toString(), {
        action: "deleteProjectUser",
        source: "ADMIN",
        success: true,
        data: { username },
      });
    }

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
