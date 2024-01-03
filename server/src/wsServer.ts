import WebSocket from "ws";
import http, { IncomingMessage } from "http";
import cognitoTokenVerifier from "./utilities/cognitoTokenVerifier";

interface Project {
  data: string; // Placeholder for actual structure. Replace with multiple properties.
  projectUsers: string[]; //Replace with more complex structure if needed
  clients: Map<WebSocket, string>;
}

// TODO: Change name?
interface CustomIncomingMessage extends IncomingMessage {
  username?: string;
  projectID?: string; // TODO: Does this need type change to match ObjectID?
}

const projects: Record<string, Project> = {};

// TODO: Refine
// WebSocket connection handshake authentication function
const verifyClient: WebSocket.VerifyClientCallbackAsync = async (info: { req: CustomIncomingMessage }, cb) => {
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

    if (!projects[projectID]) {
      // TODO: retrieve project data
      const data: string = "test";
      const projectUsers: string[] = ["TestUser"];

      // check if username is a ProjectUser for the project
      if (!projectUsers.includes(username)) return cb(false, 403, "User is not a member of this project");

      projects[projectID] = { data, projectUsers, clients: new Map() };
    } else {
      // check if username is a ProjectUser for the project
      if (!projects[projectID].projectUsers.includes(username)) return cb(false, 403, "User is not a member of this project");
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
  wss.on("connection", (ws: WebSocket, req: CustomIncomingMessage) => {
    console.log("WebSocket connection established");

    // get username and projectID from request body
    const { username, projectID } = req;
    if (!username || !projectID) return ws.close(1008, "WebSocket request is missing required values");

    // TODO: Logic to replace user with their new session if they already have an old client?
    // TODO: Anything special with socket for HTTPS?
    // add the WebSocket to the clients map
    projects[projectID].clients.set(ws, username);

    // WebSocket message handling
    ws.on("message", (message: string) => {
      console.log("Received message: " + message);
    });

    // WebSocket close handling
    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
};
