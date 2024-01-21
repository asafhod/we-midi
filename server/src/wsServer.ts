import WebSocket from "ws";
import http, { IncomingMessage } from "http";
import mongoose from "mongoose";
import cognitoTokenVerifier from "./utilities/cognitoTokenVerifier";
import ProjectUserModel from "./models/projectUserModel";
import webSocketManager from "./webSocketManager";
import wsMessageRouter from "./routes/wsMessages";
import { BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, SERVER_ERROR } from "./errors/errorMessages";
import { broadcast } from "./controllers/helpers";
import { getProject } from "./controllers/projects";

// TODO: Anything special with socket for HTTPS? Saw something that made it seem that way when hovering over one of the ws values.
//       Though ChatGPT didn't point out anything at the general level. Double check.

interface WebSocketConnectionRequest extends IncomingMessage {
  username?: string;
  projectID?: string;
}

// WebSocket connection handshake authentication function
const verifyClient: WebSocket.VerifyClientCallbackAsync = async (info: { req: WebSocketConnectionRequest }, cb) => {
  // get authorization header
  const authHeader: string | undefined = info.req.headers.authorization;

  // validate authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // reject WebSocket connection if authorization header is invalid
    console.error("WebSocket client verification failed: Authorization header is missing or invalid");
    return cb(false, 401, UNAUTHORIZED);
  }

  // get Cognito token from authorization header
  const token: string = authHeader.split(" ")[1];

  try {
    // verify and decode Cognito token
    const payload = await cognitoTokenVerifier.verify(token);

    // get username from Cognito token
    const { username } = payload;
    if (!username) {
      console.error("WebSocket client verification failed: Username is required");
      return cb(false, 400, BAD_REQUEST);
    }

    // get projectID from web request
    const url = new URL(info.req.url || "");
    const projectID: string | null = url.searchParams.get("projectID");
    if (!projectID) {
      console.error("WebSocket client verification failed: Project ID is required");
      return cb(false, 400, BAD_REQUEST);
    }

    // validate projectID is a 24-character hexadecimal string (a valid MongoDB ObjectId)
    const objectIdRegex: RegExp = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(projectID)) {
      console.error("WebSocket client verification failed: Project ID is not a valid MongoDB ObjectId");
      return cb(false, 400, BAD_REQUEST);
    }

    try {
      // check if an accepted ProjectUser matching the projectID and username exists
      const projectUserExists = await ProjectUserModel.exists({
        projectID: new mongoose.Types.ObjectId(projectID),
        username,
        isAccepted: true,
      });
      if (!projectUserExists) {
        console.error("WebSocket client verification failed: User is not a member of this project");
        return cb(false, 403, FORBIDDEN);
      }
    } catch (error) {
      console.error(`WebSocket client verification failed - MongoDB Error: ${error}`);
      return cb(false, 500, SERVER_ERROR);
    }

    // set username and projectID on request body
    info.req.username = username;
    info.req.projectID = projectID;

    // continue with WebSocket connection
    cb(true);
  } catch (error) {
    // reject WebSocket connection if Cognito token fails verification
    console.error("WebSocket client verification failed: Authentication token is invalid or expired");
    cb(false, 401, UNAUTHORIZED);
  }
};

export const configureWsServer = (server: http.Server) => {
  const wss: WebSocket.Server = new WebSocket.Server({ server, verifyClient });

  // WebSocket event handling
  wss.on("connection", (ws: WebSocket, req: WebSocketConnectionRequest) => {
    // get username and projectID from request body
    const { username, projectID } = req;
    if (!username || !projectID) {
      console.error(
        `WebSocket connection aborted - Username and/or projectID were not passed from Client Verification function to Connection Event callback`
      );
      if (ws.readyState === WebSocket.OPEN) ws.close(1011, SERVER_ERROR);

      return;
    }

    console.log(`A WebSocket connection has been established with user ${username} for project ID ${projectID}`);

    // add client WebSocket connection to the WebSocket manager
    if (!webSocketManager[projectID]) {
      // client dictionary does not currently exist for the project, create it and add the username & WebSocket connection pair
      webSocketManager[projectID] = { [username]: ws };
    } else {
      // get any prior WebSocket connection for the project with matching username
      const existingConnection: WebSocket | undefined = webSocketManager[projectID][username];

      // set username entry in the project's client dictionary to the new WebSocket connection
      webSocketManager[projectID][username] = ws;

      if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
        // close the out-of-date WebSocket connection
        existingConnection.close(1000, "Replaced by a new WebSocket connection");
        console.log(`Out-of-date WebSocket connection replaced by new connection for user ${username} on projectID ${projectID}`);
      } else {
        // broadcast that the user has connected
        broadcast(projectID, { action: "userConnected", success: true, data: { username } }, ws);
      }
    }

    // WebSocket message handling
    ws.on("message", (message: string) => wsMessageRouter(ws, message, username, projectID));

    // WebSocket close handling
    ws.on("close", (code: number, reason: Buffer) => {
      console.log(
        `A WebSocket connection has been closed for user ${username} on project ID ${projectID}\nCode: ${code} Reason: ${reason.toString()}`
      );

      const existingConnection: WebSocket | undefined = webSocketManager[projectID] && webSocketManager[projectID][username];
      if (existingConnection === ws) {
        if (Object.keys(webSocketManager[projectID]).length === 1) {
          delete webSocketManager[projectID];
        } else {
          delete webSocketManager[projectID][username];

          if (code === 4204) {
            // user is no longer a member of the project, broadcast deleteProjectUser message
            broadcast(projectID, { action: "deleteProjectUser", success: true, data: { username } }, ws);
          } else {
            // broadcast that the user has disconnected
            broadcast(projectID, { action: "userDisconnected", success: true, data: { username } }, ws);
          }
        }
      }
    });

    // on intial connection, send project data to the client
    getProject(ws, projectID);
  });
};
