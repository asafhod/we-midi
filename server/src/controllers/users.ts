import { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import AWS from "aws-sdk";
import UserModel, { User } from "../models/userModel";
import { updateUserSchema, searchUsersSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, NotFoundError } from "../errors";
import { formatQueryArray } from "./helpers";

// TODO: searchUsers, updateUser, deleteUser

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
    // destructure username from url parameter
    const { username } = req.params;

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // query database for user matching username
    // TODO: Confirm leaving out __v using the projection is necessary. Probably is.
    const user: User | null = await UserModel.findOne({ username }, { __v: 0 });
    if (!user) throw new NotFoundError(`No user found matching username: ${username}`);

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

  // query database for all users
  const users = await UserModel.find({}, { __v: 0 });

  // respond successfully with user data
  ws.send(JSON.stringify({ action: "searchUsers", success: true, data: users }));
};

// update user (admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate request body with Joi schema
    const { error } = updateUserSchema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    // TODO: Implement. Also needs to update Cognito.
  } catch (error) {
    next(error);
  }
};

// delete user (admin only)
// TODO: Implement. Also needs to update Cognito.
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");

    // delete user matching username in database
    const user = await UserModel.findOneAndDelete({ username }, { projection: { __v: 0 } });
    if (!user) throw new NotFoundError(`No user found matching username: ${username}`);

    // log successful user deletion to the console
    console.log(`User ${req.username} deleted user: ${username}`);

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
