import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import UserModel from "../models/userModel";
import ProjectUserModel from "../models/projectUserModel";
import { ForbiddenError } from "../errors";

// middleware that checks if the user making the request is an admin
export const checkAdminMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  // check if an admin user exists for the username specified on the request
  const adminExists = await UserModel.exists({ username: req.username, isAdmin: true });

  if (adminExists) {
    // user is an admin - call next middleware
    next();
  } else {
    // user is not an admin - throw Forbidden error
    throw new ForbiddenError(`Request rejected - User ${req.username} is not an admin`);
  }
};

// function that returns whether a user is an admin
export const checkAdmin = async (username: string) => {
  // check if an admin user exists for the specified username
  const adminExists = await UserModel.exists({ username, isAdmin: true });

  if (adminExists) return true;

  return false;
};

// function that returns whether a user is a project admin
export const checkProjectAdmin = async (username: string, projectID: mongoose.Types.ObjectId) => {
  // check if an accepted admin ProjectUser exists for the specified username and projectID
  const projectAdminExists = await ProjectUserModel.exists({ username, projectID, isProjectAdmin: true, isAccepted: true });

  if (projectAdminExists) return true;

  return false;
};
