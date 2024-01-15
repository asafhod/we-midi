import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import UserModel, { User } from "../models/userModel";
import { updateUserSchema, searchUsersSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, ForbiddenError, NotFoundError } from "../errors";
import { formatQueryArray } from "./helpers";

// TODO: Make sure deleteUser has Cognito permissions to delete a user and that it's secure (as in people can't do it from the browser client)
//       Confirm leaving out __v using the projection is necessary. Probably is.

// get users based on url query arguments (admin only)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure url query arguments from request
    const { usernames, isAdmin } = req.query;

    // initialize query to empty object
    const query: Record<string, any> = {};

    // set up query object for usernames array
    if (usernames) {
      // format argument into array
      const usernamesArray: RegExp[] = formatQueryArray(usernames as string);
      // set query field for username with the "$in" property to allow querying based on all of the usernames array entries
      query.username = { $in: usernamesArray };
    }

    // set up query object for isAdmin field
    if (isAdmin) {
      // cast string argument to boolean
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

// search users (ws)
export const searchUsers = async (ws: WebSocket, data: any) => {
  // validate data with Joi schema
  const { error } = searchUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // query database for all users whose username begins with the search string
  const users: User[] = await UserModel.find({ username: new RegExp(`^${data.search}`, "i") }, { __v: 0 });

  // respond successfully with user data
  ws.send(JSON.stringify({ action: "searchUsers", success: true, data: users }));
};

// update user (admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  // set up transaction for update operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // validate request body with Joi schema
    const { error } = updateUserSchema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    // get target username from url parameter
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // update the user in the database based on request body, using "new" flag to retrieve the updated entry
    const user: User | null = await UserModel.findOneAndUpdate(
      { username },
      { $set: req.body },
      {
        new: true,
        projection: { __v: 0 },
      }
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
  // set up transaction for delete operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // get target username from url parameter
    const username: string = req.params.username.toLowerCase(); // to lower case for case-insensitivity

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // prevent user from deleting themselves
    if (req.username === username) throw new ForbiddenError("User cannot delete themselves");

    // delete the user from the database
    const user: User | null = await UserModel.findOneAndDelete({ username }, { projection: { __v: 0 } });
    if (!user) throw new NotFoundError(`No user found for username: ${username}`);

    // set up Cognito Identity Service Provider
    const cognito = new CognitoIdentityServiceProvider();

    // retrieve and validate AWS User Pool ID environment variable
    const { AWS_USER_POOL_ID } = process.env;
    if (!AWS_USER_POOL_ID) throw new Error("Environment variable AWS_USER_POOL_ID is required");

    // delete the user from Cognito
    await cognito.adminDeleteUser({ UserPoolId: AWS_USER_POOL_ID, Username: username }).promise();

    // both delete operations were successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // log successful user deletion to the console
    console.log(`User ${req.username} deleted user: ${username}`);

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
