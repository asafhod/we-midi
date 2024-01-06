import WebSocket from "ws";
import http, { IncomingMessage } from "http";
import cognitoTokenVerifier from "./utilities/cognitoTokenVerifier";
import ProjectUserModel, { ProjectUser } from "./models/projectUserModel";
import webSocketManager from "./webSocketManager";

// TODO: Middleware pattern? Like for validator or error handler?
// TODO: Anything special with socket for HTTPS?

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
    return cb(false, 401, "Authorization header is missing or invalid");
  }

  // get Cognito token from authorization header
  const token: string = authHeader.split(" ")[1];

  try {
    // verify and decode Cognito token
    const payload = await cognitoTokenVerifier.verify(token);

    // get username from Cognito token
    const { username } = payload;
    if (!username) return cb(false, 400, "Username is required");

    // get projectID from web request
    const url = new URL(info.req.url || "");
    const projectID: string | null = url.searchParams.get("projectID");
    if (!projectID) return cb(false, 400, "Project ID is required");

    try {
      // check if ProjectUser matching the projectID and username exists
      const projectUser: ProjectUser | null = await ProjectUserModel.findOne({ projectID, username }, { __v: 0 });
      if (!projectUser) return cb(false, 403, "User is not a member of this project");
    } catch (error) {
      return cb(false, 500, "Server error - Please try again later");
    }

    // set username and projectID on request body
    info.req.username = username;
    info.req.projectID = projectID;

    // continue with WebSocket connection
    cb(true);
  } catch (error) {
    // reject WebSocket connection if Cognito token fails verification
    cb(false, 401, "Authentication token is invalid or expired");
  }
};

export const configureWsServer = (server: http.Server) => {
  const wss: WebSocket.Server = new WebSocket.Server({ server, verifyClient });

  // WebSocket event handling
  wss.on("connection", (ws: WebSocket, req: WebSocketConnectionRequest) => {
    // get username and projectID from request body
    const { username, projectID } = req;
    if (!username || !projectID) return ws.close(1008, "WebSocket connection request is missing required values");

    console.log(`A WebSocket connection has been established with user ${username} for project ID ${projectID}`);

    if (!webSocketManager[projectID]) {
      // client dictionary does not currently exist for the project, create it and add the username & WebSocket connection pair
      webSocketManager[projectID] = { [username]: ws };
    } else {
      // get any prior WebSocket connection for the project with matching username
      const existingConnection: WebSocket | undefined = webSocketManager[projectID][username];

      // set username entry in the project's client dictionary to the new WebSocket connection
      webSocketManager[projectID][username] = ws;

      if (existingConnection) {
        // close the out-of-date WebSocket connection
        existingConnection.close(1000, "Replaced by a new WebSocket connection");
      }
    }

    // TODO: Implement
    // WebSocket message handling
    ws.on("message", (message: string) => {
      console.log(`Received message from user ${username} for project ID ${projectID}: ${message}`);
    });

    // WebSocket close handling
    ws.on("close", () => {
      console.log(`A WebSocket connection has been closed with user ${username} for project ID ${projectID}`);

      const existingConnection: WebSocket | undefined = webSocketManager[projectID] && webSocketManager[projectID][username];
      if (existingConnection === ws) {
        if (Object.keys(webSocketManager[projectID]).length === 1) {
          delete webSocketManager[projectID];
        } else {
          delete webSocketManager[projectID][username];
        }
      }
    });
  });
};
