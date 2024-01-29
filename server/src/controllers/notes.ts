import WebSocket from "ws";
import {
  addNoteSchema,
  addNotesSchema,
  updateNoteSchema,
  updateNotesSchema,
  deleteNoteSchema,
  deleteNotesSchema,
  deleteAllNotesOnTrackSchema,
} from "../validation/schemas";
import { BadMessageError } from "../errors";

// add note (WebSocket)
export const addNote = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = addNoteSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with note data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "addNote", success: true, data: note }));
};

// add notes (WebSocket)
// TODO: If there are no notes for the track already, can just overwrite the old notes array with the new one
export const addNotes = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = addNotesSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the notes
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "addNotes", success: true, data: notes }));
};

// update note (WebSocket)
// TODO: Needs optimistic updates?
export const updateNote = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateNoteSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with note data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "updateNote", success: true, data: note }));
};

// update notes (WebSocket)
// TODO: Needs optimistic updates?
export const updateNotes = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateNotesSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the notes
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "updateNotes", success: true, data: notes }));
};

// delete note (WebSocket)
export const deleteNote = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteNoteSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with note data
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "deleteNote", success: true, data: note }));
};

// delete notes (WebSocket)
export const deleteNotes = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteNotesSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the notes
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "deleteNotes", success: true, data: notes }));
};

// delete all notes on track (WebSocket)
export const deleteAllNotesOnTrack = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteAllNotesOnTrackSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with data for the notes
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "deleteAllNotesOnTrack", success: true, data: notes }));
};
