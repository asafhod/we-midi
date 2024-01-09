import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ArraySchema } from "joi";
import {
  updateUserSchema,
  addProjectSchema,
  updateProjectSchema,
  addProjectUsersSchema,
  addProjectUserSchema,
  updateProjectUsersSchema,
} from "../validation/schemas";
import { BadRequestError } from "../errors";

// closure which accepts joi schema and returns validation middleware for it
const validator = (schema: ObjectSchema<any> | ArraySchema<any[]>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // validate request body matches schema
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    next();
  };
};

// use validator function to generate validation middleware for all schemas
export const validateUpdateUser = validator(updateUserSchema);
export const validateAddProject = validator(addProjectSchema);
export const validateUpdateProject = validator(updateProjectSchema);
export const validateAddProjectUsers = validator(addProjectUsersSchema);
export const validateAddProjectUser = validator(addProjectUserSchema);
export const validateUpdateProjectUsers = validator(updateProjectUsersSchema);
