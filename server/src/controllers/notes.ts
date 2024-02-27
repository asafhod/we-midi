import mongoose from "mongoose";
import WebSocket from "ws";
import ProjectModel, { Project, Note } from "../models/projectModel";
import {
  addNoteSchema,
  addNotesSchema,
  updateNoteSchema,
  updateNotesSchema,
  deleteNoteSchema,
  deleteNotesSchema,
} from "../validation/schemas";
import { BadMessageError, NotFoundError } from "../errors";
import { SERVER_ERROR } from "../errors/errorMessages";
import { broadcast, sendMessage } from "./helpers";

// add note (WebSocket)
export const addNote = async (ws: WebSocket, projectID: string, username: string, data: any, errorData: any) => {
  // validate data with Joi schema
  const { error } = addNoteSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // destructure necessary fields from message data
  const { trackID, clientNoteID, midiNum, duration, noteTime, velocity } = data;

  try {
    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // get current lastNoteID value from the database for the track on the project
    const trackData = await ProjectModel.findOne({ _id: projectObjectId, "tracks.trackID": trackID }, { "tracks.$": 1 });
    if (!trackData) throw new NotFoundError(`No track found for Project ID ${projectID} and Track ID ${trackID}`);

    // calculate new note's ID by incrementing the current lastNoteID by 1
    const newNoteID: number = trackData.tracks[0].lastNoteID + 1;

    // set up the new note object
    const newNote: Note = { noteID: newNoteID, midiNum, duration, noteTime, velocity };

    // push the new note to the notes array for the track on the project in the database and set the new lastNoteID
    const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
      { _id: projectObjectId, "tracks.trackID": trackID },
      { $set: { "tracks.$.lastNoteID": newNoteID }, $push: { "tracks.$.notes": newNote } },
      // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
      { new: true, __v: 0 }
    );
    if (!updatedProject) throw new NotFoundError(`No track found for Project ID ${projectID} and Track ID ${trackID}`);

    // log successful note addition to the console
    console.log(`User ${username} added new Note ${newNoteID} to Track ${trackID} of Project ${projectID}`);

    // send the new Note ID to the user that added the note
    sendMessage(ws, { action: "addNote", source: username, success: true, data: { trackID, clientNoteID, noteID: newNoteID } });

    // broadcast the note addition to any other connected users for the project
    broadcast(projectID, { action: "addNote", source: username, success: true, data: { trackID, ...newNote } }, ws);
  } catch (error) {
    errorData.trackID = trackID;
    errorData.clientNoteID = clientNoteID;

    throw error;
  }
};

// add notes (WebSocket)
export const addNotes = async (ws: WebSocket, projectID: string, username: string, data: any, errorData: any) => {
  // validate data with Joi schema
  const { error } = addNotesSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // destructure the trackID and array of notes to add from the message data
  const { trackID, notes } = data;

  try {
    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // get current lastNoteID value from the database for the track on the project
    const trackData = await ProjectModel.findOne({ _id: projectObjectId, "tracks.trackID": trackID }, { "tracks.$": 1 });
    if (!trackData) throw new NotFoundError(`No track found for Project ID ${projectID} and Track ID ${trackID}`);

    // initialize new Note ID variable to the current lastNoteID
    let newNoteID: number = trackData.tracks[0].lastNoteID;

    // add noteID property to every note in notes array
    for (const note of notes) {
      // increment new Note ID
      newNoteID++;

      // set the Note ID in the notes array
      note.noteID = newNoteID;
    }

    // map notes array, excluding the clientNoteID field so the notes can be inserted into the database
    const newNotes: Note[] = notes.map(({ clientNoteID, ...rest }: { clientNoteID: number; [key: string]: any }) => rest);

    // set up transaction for batch note addition update operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // push the new notes to the notes array for the track on the project in the database and set the new lastNoteID
      const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
        { _id: projectObjectId, "tracks.trackID": trackID },
        { $set: { "tracks.$.lastNoteID": newNoteID }, $push: { "tracks.$.notes": { $each: newNotes } } },
        // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
        { new: true, __v: 0, session }
      );
      if (!updatedProject) throw new NotFoundError(`No track found for Project ID ${projectID} and Track ID ${trackID}`);

      // if successful, commit and end the transaction
      await session.commitTransaction();
      session.endSession();

      // log successful batch note addition to the console
      console.log(`User ${username} added new notes to Track ${trackID} of Project ${projectID}`);

      // map notes array, keeping only the clientNoteID and noteID fields so the new Note IDs can be sent to the user to update
      const newNoteIDs = notes.map(({ clientNoteID, noteID }: { clientNoteID: number; noteID: number }) => ({ clientNoteID, noteID }));

      // send the new Note IDs to the user that added the notes
      sendMessage(ws, { action: "addNotes", source: username, success: true, data: { trackID, noteIDs: newNoteIDs } });

      // broadcast the batch note addition to any other connected users for the project
      broadcast(projectID, { action: "addNotes", source: username, success: true, data: { trackID, notes: newNotes } }, ws);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    errorData.trackID = trackID;

    // map notes array, keeping only the clientNoteIDs so they can be sent to the user to roll back
    errorData.clientNoteIDs = notes.map(({ clientNoteID }: { clientNoteID: number }) => clientNoteID);

    throw error;
  }
};

// update note (WebSocket)
export const updateNote = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  try {
    // validate data with Joi schema
    const { error } = updateNoteSchema.validate(data, { abortEarly: false });
    if (error) throw new BadMessageError(String(error));

    // destructure necessary fields from message data
    const { trackID, ...updatedNote } = data;

    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // update the note in the notes array for the track on the project in the database
    const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
      { _id: projectObjectId, "tracks.trackID": trackID, "tracks.notes.noteID": updatedNote.noteID },
      { $set: { "tracks.$[outer].notes.$[inner]": updatedNote } },
      // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
      { arrayFilters: [{ "outer.trackID": trackID }, { "inner.noteID": updatedNote.noteID }], new: true, __v: 0 }
    );

    if (updatedProject) {
      // log successful note update to the console
      console.log(`User ${username} updated Note ${updatedNote.noteID} on Track ${trackID} of Project ${projectID}`);

      // broadcast the note update to all connected users for the project
      broadcast(projectID, { action: "updateNote", source: username, success: true, data });
    }
  } catch (error) {
    // note cannot be updated or rolled back due to a database error, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);
    console.error(`Action: updateNote\nError: Could not update note - ${error}`);
  }
};

// update notes (WebSocket)
export const updateNotes = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  try {
    // validate data with Joi schema
    const { error } = updateNotesSchema.validate(data, { abortEarly: false });
    if (error) throw new BadMessageError(String(error));

    // destructure the trackID and array of notes to update from the message data
    const { trackID, notes } = data;

    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // set up the update operations array
    const updateNoteOperations = notes.map((updatedNote: Note) => {
      return {
        updateOne: {
          filter: { _id: projectObjectId, "tracks.trackID": trackID, "tracks.notes.noteID": updatedNote.noteID },
          update: { $set: { "tracks.$[outer].notes.$[inner]": updatedNote } },
          arrayFilters: [{ "outer.trackID": trackID }, { "inner.noteID": updatedNote.noteID }],
        },
      };
    });

    // set up transaction for batch note update operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // update the notes in the specified track for the project in the database
      const result = await ProjectModel.bulkWrite(updateNoteOperations, { session });

      // if successful, commit and end the transaction
      await session.commitTransaction();
      session.endSession();

      if (result.modifiedCount) {
        // log successful batch note update to the console
        console.log(`User ${username} updated notes on Track ${trackID} of Project ${projectID}`);

        // broadcast the batch note update to all connected users for the project
        broadcast(projectID, { action: "updateNotes", source: username, success: true, data });
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    // notes cannot be updated or rolled back due to a database error, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);
    console.error(`Action: updateNotes\nError: Could not update notes - ${error}`);
  }
};

// delete note (WebSocket)
export const deleteNote = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  try {
    // validate data with Joi schema
    const { error } = deleteNoteSchema.validate(data, { abortEarly: false });
    if (error) throw new BadMessageError(String(error));

    // destructure necessary fields from message data
    const { trackID, noteID } = data;

    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // delete the note from the specified track for the project in the database
    const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
      { _id: projectObjectId, "tracks.trackID": trackID },
      { $pull: { "tracks.$.notes": { noteID } } },
      // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
      { new: true, __v: 0 }
    );

    if (updatedProject) {
      // log successful note deletion to the console
      console.log(`User ${username} deleted Note ${noteID} from Track ${trackID} of Project ${projectID}`);

      // broadcast the note deletion to any other connected users for the project
      broadcast(projectID, { action: "deleteNote", source: username, success: true, data }, ws);
    }
  } catch (error) {
    // note cannot be deleted or rolled back due to a database error, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);
    console.error(`Action: deleteNote\nError: Could not delete note - ${error}`);
  }
};

// delete notes (WebSocket)
export const deleteNotes = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  try {
    // validate data with Joi schema
    const { error } = deleteNotesSchema.validate(data, { abortEarly: false });
    if (error) throw new BadMessageError(String(error));

    // destructure the trackID and array of Note IDs for the batch deletion from the message data
    const { trackID, noteIDs } = data;

    // convert projectID string to a MongoDB ObjectId
    const projectObjectId = new mongoose.Types.ObjectId(projectID);

    // set up transaction for batch note deletion update operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // delete the notes from the specified track for the project in the database
      const updatedProject: Project | null = await ProjectModel.findOneAndUpdate(
        { _id: projectObjectId, "tracks.trackID": trackID },
        { $pull: { "tracks.$.notes": { noteID: { $in: noteIDs } } } },
        // using "new" flag to retrieve the updated document and projection to avoid retrieving unnecessary fields
        { new: true, __v: 0, session }
      );

      // if successful, commit and end the transaction
      await session.commitTransaction();
      session.endSession();

      if (updatedProject) {
        // log successful batch note deletion to the console
        console.log(`User ${username} deleted notes from Track ${trackID} of Project ${projectID}`);

        // broadcast the batch note deletion to any other connected users for the project
        broadcast(projectID, { action: "deleteNotes", source: username, success: true, data }, ws);
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    // notes cannot be deleted or rolled back due to a database error, close the WebSocket connection with a Server Error message if it's open
    if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);
    console.error(`Action: deleteNotes\nError: Could not delete notes - ${error}`);
  }
};
