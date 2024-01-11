import WebSocket from "ws";
import {
  validateUpdateProject,
  validateAddProjectUsers,
  validateUpdateProjectUsers,
  validateDeleteProjectUsers,
  validateImportMidi,
  validateChangeTempo,
  validateUpdateTrack,
  validateDeleteTrack,
  validateAddNote,
  validateAddNotes,
  validateUpdateNote,
  validateUpdateNotes,
  validateDeleteNote,
  validateDeleteNotes,
  validateDeleteAllNotesOnTrack,
} from "../middleware/validator";
import { getUsers } from "../controllers/users";
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

// WS:
// update project, [get project, delete project]
// add projectUsers, update projectUsers, delete projectUsers, [delete projectUser]
// [get users]
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

// TODO: Move each schema validation into its associated controller (including the error throw, and for HTTP as well) and get rid of validator.ts

const router = (ws: WebSocket, message: string, username: string, projectID: string) => {
  console.log(`Received message from user ${username} for project ID ${projectID}: ${message}`);

  let action: unknown;
  let data: any;

  try {
    try {
      // parse message string to JSON and destructure assign its action and data properties
      ({ action, data } = JSON.parse(message));
    } catch (error) {
      throw new Error("Message contains invalid JSON");
    }

    switch (action) {
      case "getProject":
        getProject(ws, projectID);
        break;
      case "updateProject":
        validateUpdateProject(data);
        updateProject(ws, projectID, username, data);
        break;
      case "deleteProject":
        deleteProject(ws, projectID, username);
        break;
      case "getUsers":
        // TODO: Validate search string is not "" in the controller
        getUsers(ws, data);
        break;
      case "addProjectUsers":
        validateAddProjectUsers(data);
        addProjectUsers(ws, projectID, username, data);
        break;
      case "updateProjectUsers":
        validateUpdateProjectUsers(data);
        updateProjectUsers(ws, projectID, username, data);
        break;
      case "deleteProjectUsers":
        validateDeleteProjectUsers(data);
        deleteProjectUsers(ws, projectID, username, data);
        break;
      case "deleteProjectUser":
        deleteProjectUser(ws, projectID, username);
        break;
      case "importMIDI":
        validateImportMidi(data);
        importMidi(ws, projectID, username, data);
        break;
      case "changeTempo":
        validateChangeTempo(data);
        changeTempo(ws, projectID, username, data);
        break;
      case "addTrack":
        addTrack(ws, projectID, username);
        break;
      case "updateTrack":
        validateUpdateTrack(data);
        updateTrack(ws, projectID, username, data);
        break;
      case "deleteTrack":
        validateDeleteTrack(data);
        deleteTrack(ws, projectID, username, data);
        break;
      case "addNote":
        validateAddNote(data);
        addNote(ws, projectID, username, data);
        break;
      case "addNotes":
        validateAddNotes(data);
        addNotes(ws, projectID, username, data);
        break;
      case "updateNote":
        validateUpdateNote(data);
        updateNote(ws, projectID, username, data);
        break;
      case "updateNotes":
        validateUpdateNotes(data);
        updateNotes(ws, projectID, username, data);
        break;
      case "deleteNote":
        validateDeleteNote(data);
        deleteNote(ws, projectID, username, data);
        break;
      case "deleteNotes":
        validateDeleteNotes(data);
        deleteNotes(ws, projectID, username, data);
        break;
      case "deleteAllNotesOnTrack":
        validateDeleteAllNotesOnTrack(data);
        deleteAllNotesOnTrack(ws, projectID, username, data);
        break;
      default:
        throw new Error(`Unknown message action: ${action}`);
    }
  } catch (error) {
    // handle error
    wsErrorHandler(error, ws, action);
  }
};

export default router;
