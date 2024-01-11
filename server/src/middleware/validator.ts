import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ArraySchema } from "joi";
import {
  updateUserSchema,
  addProjectSchema,
  updateProjectSchema,
  addProjectUsersSchema,
  updateProjectUsersSchema,
  deleteProjectUsersSchema,
  importMidiSchema,
  changeTempoSchema,
  updateTrackSchema,
  deleteTrackSchema,
  addNoteSchema,
  addNotesSchema,
  updateNoteSchema,
  updateNotesSchema,
  deleteNoteSchema,
  deleteNotesSchema,
  deleteAllNotesOnTrackSchema,
} from "../validation/schemas";
import { BadRequestError } from "../errors";

// closure which accepts joi schema and returns corresponding validation middleware for HTTP requests
const validator = (schema: ObjectSchema<any> | ArraySchema<any[]>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // validate request body matches schema
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    next();
  };
};

// closure which accepts joi schema and returns corresponding validation middleware for WebSockets
const wsValidator = (schema: ObjectSchema<any> | ArraySchema<any[]>) => {
  return (data: any) => {
    // validate request body matches schema
    const { error } = schema.validate(data, { abortEarly: false });
    // TODO: Change to WebSocket error code? New error type?
    if (error) throw new BadRequestError(String(error));
  };
};

// use validator functions to generate validation middleware for all schemas
export const validateUpdateUser = validator(updateUserSchema);
export const validateAddProject = validator(addProjectSchema);
export const validateUpdateProject = wsValidator(updateProjectSchema);
export const validateAddProjectUsers = wsValidator(addProjectUsersSchema);
export const validateUpdateProjectUsers = wsValidator(updateProjectUsersSchema);
export const validateDeleteProjectUsers = wsValidator(deleteProjectUsersSchema);
export const validateImportMidi = wsValidator(importMidiSchema);
export const validateChangeTempo = wsValidator(changeTempoSchema);
export const validateUpdateTrack = wsValidator(updateTrackSchema);
export const validateDeleteTrack = wsValidator(deleteTrackSchema);
export const validateAddNote = wsValidator(addNoteSchema);
export const validateAddNotes = wsValidator(addNotesSchema);
export const validateUpdateNote = wsValidator(updateNoteSchema);
export const validateUpdateNotes = wsValidator(updateNotesSchema);
export const validateDeleteNote = wsValidator(deleteNoteSchema);
export const validateDeleteNotes = wsValidator(deleteNotesSchema);
export const validateDeleteAllNotesOnTrack = wsValidator(deleteAllNotesOnTrackSchema);
