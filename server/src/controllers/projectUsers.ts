import { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import ProjectUserModel from "../models/projectUserModel";
import { addProjectUsersSchema, updateProjectUsersSchema, deleteProjectUsersSchema } from "../validation/schemas";
import { BadRequestError, BadMessageError, NotFoundError } from "../errors";

// get projectUsers based on url query arguments
export const getProjectUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure projectID and username from url query arguments
    const { projectID, username } = req.query;

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");
    // TODO: validate projectID

    // query database for projectUsers matching projectID and/or username
    // TODO: Use a query object to make it ignore empty string like you did for getUsers
    const projectUsers = await ProjectUserModel.find({ projectID, username }, { __v: 0 });

    // respond successfully with projectUser data
    res.status(200).json({
      success: true,
      data: projectUsers,
    });
  } catch (error) {
    next(error);
  }
};

// get projectUser by projectID and username
export const getProjectUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure projectID and username from url parameter
    const { projectID, username } = req.params;

    // validate username
    if (username.length > 128) throw new BadRequestError("Username cannot exceed 128 characters");
    // TODO: validate projectID

    // query database for projectUser matching projectID and username
    const projectUser = await ProjectUserModel.findOne({ projectID, username }, { __v: 0 });
    if (!projectUser) throw new NotFoundError(`No ProjectUser found matching projectID ${projectID} and username ${username}`);

    // respond successfully with projectUser data
    res.status(200).json({
      success: true,
      data: projectUser,
    });
  } catch (error) {
    next(error);
  }
};

// update projectUser and set its accepted property to True when a user accepts a project invite
export const acceptProjectUser = async (req: Request, res: Response, next: NextFunction) => {
  // placeholder for body
};

// add projectUsers (ws)
export const addProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = addProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the projectUsers
  ws.send(JSON.stringify({ action: "addProjectUsers", success: true, data: projectUsers }));
};

// update projectUsers (ws)
export const updateProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the projectUsers
  ws.send(JSON.stringify({ action: "updateProjectUsers", success: true, data: projectUsers }));
};

// delete projectUsers (ws)
export const deleteProjectUsers = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteProjectUsersSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the projectUsers
  ws.send(JSON.stringify({ action: "deleteProjectUsers", success: true, data: projectUsers }));
};

// delete projectUser (ws)
export const deleteProjectUser = async (ws: WebSocket, projectID: string, username: string) => {
  // respond successfully with projectUser data
  ws.send(JSON.stringify({ action: "deleteProjectUser", success: true, data: projectUser }));
};

// delete projectUser
export const deleteProjectUserHttp = async (req: Request, res: Response, next: NextFunction) => {
  // placeholder for body
};
