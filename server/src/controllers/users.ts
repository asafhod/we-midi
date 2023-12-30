import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import { BadRequestError, NotFoundError } from "../errors";

// TODO: Make sure aligns with TypeScript. What type to give the query results variables? Do I type the responses? Ask ChatGPT.
// getUsers, getUser, updateUser, deleteUser

// get all users (admin only)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // query database for all users
    const users = await User.find({}, { password: 0, __v: 0 });

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
    if (username.length > 25) throw new BadRequestError("Username cannot exceed 25 characters");

    // query database for user matching username
    const user = await User.findOne({ username }, { password: 0, __v: 0 });
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

// delete user (admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    // validate username
    if (username.length > 25) throw new BadRequestError("Username cannot exceed 25 characters");

    // delete user matching username in database
    const user = await User.findOneAndDelete({ username }, { projection: { password: 0, __v: 0 } });
    if (!user) throw new NotFoundError(`No user found matching username: ${username}`);

    // log successful user deletion to the console
    console.log(`User ${req.username} deleted user: ${username}`);

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
