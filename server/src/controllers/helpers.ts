import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import { SERVER_ERROR } from "../errors/errorMessages";

interface Message {
  action: string;
  success: boolean;
  data: any;
}

// helper function which sends a message to a WebSocket connection, or closes the connection if there is an error
export const sendMessage = (ws: WebSocket, message: Message) => {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      // Message failed to send due to WebSocket connection error. Close the connection.
      ws.close(1011, SERVER_ERROR);
      console.error(
        `Action: ${message.action || "invalid"}\nMessage failed to send to the WebSocket connection, so it has been closed.`
      );
    }
  }
};

// function to broadcast WebSocket messages to multiple connected clients
export const broadcast = (projectID: string, message: Message, excludedSocket?: WebSocket) => {
  // check that connections exist for the project
  if (webSocketManager[projectID]) {
    if (excludedSocket) {
      // loop over all WebSocket connections for the project
      for (const projectConnection of Object.values(webSocketManager[projectID])) {
        // send message to the WebSocket connection, unless it matches the excluded socket
        if (projectConnection !== excludedSocket) sendMessage(projectConnection, message);
      }
    } else {
      // loop over all WebSocket connections for the project
      for (const projectConnection of Object.values(webSocketManager[projectID])) {
        // send message to the WebSocket connection
        sendMessage(projectConnection, message);
      }
    }
  }
};

// helper function which formats url query arguments into arrays Mongoose can use to query the db
export const formatQueryArray = (data: string): RegExp[] => {
  // split query argument string into array
  const queryArray: string[] = data.split(",");

  // map each entry to a RegExp with the "i" flag to allow for case-insensitive querying
  const queryRegExpArray: RegExp[] = queryArray.map((entry: string) => new RegExp(`^${entry}$`, "i"));

  return queryRegExpArray;
};
