// import WebSocket library
import WebSocket from "ws";
// import error classes and type guards
import { CustomError, isMongoWriteError, isMongooseCastError } from "./index";
import { MongoBulkWriteError } from "mongodb";
// import error messages
import { BAD_MESSAGE, SERVER_ERROR } from "./errorMessages";

// function which catches any error related to WebSocket messages, logs it and any related data, and sends a response message with the appropriate action and client message
const wsErrorHandler = (error: unknown, ws: WebSocket, action: unknown, data: any) => {
  try {
    if (error instanceof CustomError) {
      // if error is one of the custom errors, send response message containing the corresponding client error message
      // TODO: Will error.name work here instead of the constructor name? If so, change it here and in the http error handler.
      console.error(`Action: ${action}\n${error.constructor.name}: ${error.message}`);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: error.clientMessage, data }));
    } else if (
      error instanceof MongoBulkWriteError &&
      error.code === 11000 &&
      Array.isArray(error.writeErrors) &&
      error.writeErrors.length > 0
    ) {
      // if error is a MongoDB Duplicate Value error for a batch operation (such as attempting to insert multiple documents where one has a duplicate id)
      console.error(
        `Action: ${action}\nMongoDB Duplicate Value Error: Batch operation aborted - Cannot insert duplicate value\nFor Object: ${error.writeErrors[0].err.op}`
      );
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: BAD_MESSAGE, data }));
    } else if (isMongoWriteError(error) && error.code === 11000) {
      // if error is a MongoDB Duplicate Value error for a non-batch operation (such as attempting to insert a document which has a duplicate id)
      console.error(
        `Action: ${action}\nMongoDB Duplicate Value Error: Cannot insert duplicate value - Field: ${
          Object.keys(error.keyValue)[0]
        }, Value: ${Object.values(error.keyValue)[0]}`
      );
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: BAD_MESSAGE, data }));
    } else if (error instanceof Error && error.name === "ValidationError") {
      // if error is a MongoDB Validation Error (such as missing a required field)
      console.error(`Action: ${action}\nMongoDB Validation Error: ${error.message}`);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: BAD_MESSAGE, data }));
    } else if (isMongooseCastError(error)) {
      // if error is a MongoDB Cast Error (such as attempting to set an array as a value for a non-array field)
      console.error(
        `Action: ${action}\nMongoDB Cast Error: Cannot cast ${error.valueType} value to ${error.kind} for field: ${error.path}\nFor Value: ${error.value}`
      );
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: BAD_MESSAGE, data }));
    } else if (error instanceof Error) {
      // any other Error
      console.error(`Action: ${action}\nError: ${error.message}`);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: SERVER_ERROR, data }));
    } else {
      // error does not have an Error type
      console.error(`Action: ${action}\nError Value: ${error}`);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action, success: false, msg: SERVER_ERROR, data }));
    }
  } catch (error) {
    // Error message failed to send due to WebSocket connection error. Close the connection.
    ws.close(1011, SERVER_ERROR);
    console.error(`Action: ${action}\nError message failed to send to the WebSocket connection, so it has been closed.`);
  }
};

export default wsErrorHandler;
