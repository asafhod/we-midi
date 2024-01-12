import { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import UserModel from "../models/userModel";
import { updateUserSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, NotFoundError } from "../errors";
// Do I need formatQueryArray? Or can I somehow extract the right kind of array directly from the query params? Or at least extract as array instead of string to save formatQueryArray a step?
import { formatQueryArray } from "./helpers";

// TODO: Make sure aligns with TypeScript. What type to give the query results variables? Do I type the responses? Ask ChatGPT.
// Also, make plural/singular order consistent across routes, schema validation, and controllers
// Start with getUser
// getUsers, getUser, updateUser, deleteUser

// get all users (admin only)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // query database for all users
    const users = await UserModel.find({}, { __v: 0 });

    // respond successfully with result count and user data
    res.status(200).json({ success: true, resultCount: users.length, data: users });
  } catch (error) {
    next(error);
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
    const user = await UserModel.findOne({ username }, { __v: 0 });
    if (!user) throw new NotFoundError(`No user found matching username: ${username}`);

    // respond successfully with user data
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// search users (ws)
export const searchUsers = async (ws: WebSocket, data: any) => {
  // TODO: Validate search string is not "". If it is (or anything else invalid you can think of), throw BadMessageError.

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
