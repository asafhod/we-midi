import WebSocket from "ws";
import { searchUsers } from "../controllers/users";
import {
  getProject,
  updateProject,
  deleteProject,
  importMidi,
  changeTempo,
  addTrack,
  updateTrack,
  deleteTrack,
} from "../controllers/projects";
import { addProjectUsers, updateProjectUsers, deleteProjectUsers, deleteProjectUser } from "../controllers/projectUsers";
import { addNote, addNotes, updateNote, updateNotes, deleteNote, deleteNotes, deleteAllNotesOnTrack } from "../controllers/notes";
import wsErrorHandler from "../errors/wsErrorHandler";
import { BadMessageError } from "../errors/";

// WS:
// update project, [get project, delete project]
// add projectUsers, update projectUsers, delete projectUsers, [delete projectUser]
// [search users]
// import MIDI
// change tempo
// update track, delete track, [add track]
// add note, add notes
// update note, update notes,
// delete notes, delete note, deleteAllNotesOnTrack

// HTTP:
// update user, [get user(s), delete user]
// [get projectUser(s), accept ProjectUser, delete projectUser]
// add project, [get projects, delete project]

const router = (ws: WebSocket, message: string, username: string, projectID: string) => {
  console.log(`Received message from user ${username} for project ID ${projectID}: ${message}`);

  let action: unknown;
  let data: any;

  try {
    try {
      // parse message string to JSON and destructure-assign its action and data properties
      ({ action, data } = JSON.parse(message));
    } catch (error) {
      throw new BadMessageError("Message contains invalid JSON");
    }

    switch (action) {
      case "getProject":
        getProject(ws, projectID);
        break;
      case "updateProject":
        updateProject(ws, projectID, username, data);
        break;
      case "deleteProject":
        deleteProject(ws, projectID, username);
        break;
      case "searchUsers":
        searchUsers(ws, data);
        break;
      case "addProjectUsers":
        addProjectUsers(ws, projectID, username, data);
        break;
      case "updateProjectUsers":
        updateProjectUsers(ws, projectID, username, data);
        break;
      case "deleteProjectUsers":
        deleteProjectUsers(ws, projectID, username, data);
        break;
      case "deleteProjectUser":
        deleteProjectUser(ws, projectID, username);
        break;
      case "importMIDI":
        importMidi(ws, projectID, username, data);
        break;
      case "changeTempo":
        changeTempo(ws, projectID, username, data);
        break;
      case "addTrack":
        addTrack(ws, projectID, username);
        break;
      case "updateTrack":
        updateTrack(ws, projectID, username, data);
        break;
      case "deleteTrack":
        deleteTrack(ws, projectID, username, data);
        break;
      case "addNote":
        addNote(ws, projectID, username, data);
        break;
      case "addNotes":
        addNotes(ws, projectID, username, data);
        break;
      case "updateNote":
        updateNote(ws, projectID, username, data);
        break;
      case "updateNotes":
        updateNotes(ws, projectID, username, data);
        break;
      case "deleteNote":
        deleteNote(ws, projectID, username, data);
        break;
      case "deleteNotes":
        deleteNotes(ws, projectID, username, data);
        break;
      case "deleteAllNotesOnTrack":
        deleteAllNotesOnTrack(ws, projectID, username, data);
        break;
      default:
        throw new BadMessageError(`Unknown message action: ${action}`);
    }
  } catch (error) {
    // handle error
    wsErrorHandler(error, ws, action);
  }
};

export default router;
