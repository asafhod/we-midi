import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ArraySchema } from "joi";
import { addProjectSchema, addProjectsSchema, updateProjectSchema, userLoginRegSchema } from "../validation/schemas";
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
export const validateAddProject = validator(addProjectSchema);
export const validateAddProjects = validator(addProjectsSchema);
export const validateUpdateProject = validator(updateProjectSchema);
export const validateLoginReg = validator(userLoginRegSchema);
