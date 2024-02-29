import WebSocket from "ws";
import { searchUsers } from "../controllers/users";
import { getProject, updateProject, deleteProject, importMidi, addTrack, updateTrack, deleteTrack } from "../controllers/projects";
import {
  addProjectUsers,
  updateProjectUsers,
  deleteProjectUsers,
  deleteProjectUser,
  userCurrentView,
  userMouse,
  chatMessage,
} from "../controllers/projectUsers";
import { addNote, addNotes, updateNote, updateNotes, deleteNote, deleteNotes } from "../controllers/notes";
import wsErrorHandler from "../errors/wsErrorHandler";
import { BadMessageError } from "../errors/";

const router = (ws: WebSocket, message: string, username: string, projectID: string) => {
  try {
    // parse message string to JSON and destructure its action and data properties
    const { action, data }: { action: unknown; data: any } = JSON.parse(message);

    // initialize errorData to an empty object (used for rollback logic on error)
    const errorData: any = {};

    // route to corresponding controller based on action
    switch (action) {
      case "getProject":
        getProject(ws, projectID);
        break;
      case "updateProject":
        updateProject(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "deleteProject":
        deleteProject(ws, projectID, username).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "importMIDI":
        importMidi(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "addTrack":
        addTrack(ws, projectID, username).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "updateTrack":
        updateTrack(ws, projectID, username, data);
        break;
      case "deleteTrack":
        deleteTrack(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "addNote":
        addNote(ws, projectID, username, data, errorData).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "addNotes":
        addNotes(ws, projectID, username, data, errorData).catch((error) => wsErrorHandler(error, ws, action, errorData));
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
      case "searchUsers":
        searchUsers(ws, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "addProjectUsers":
        addProjectUsers(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "updateProjectUsers":
        updateProjectUsers(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "deleteProjectUsers":
        deleteProjectUsers(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "deleteProjectUser":
        deleteProjectUser(ws, projectID, username).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "userCurrentView":
        userCurrentView(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "userMouse":
        userMouse(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      case "chatMessage":
        chatMessage(ws, projectID, username, data).catch((error) => wsErrorHandler(error, ws, action, errorData));
        break;
      default:
        const invalidActionError = new BadMessageError(`Invalid message action: ${action}`);
        wsErrorHandler(invalidActionError, ws, "invalid", errorData);
    }
  } catch (error) {
    const invalidJsonError = new BadMessageError("Message contains invalid JSON");
    wsErrorHandler(invalidJsonError, ws, "unknown", {});
  }
};

export default router;
