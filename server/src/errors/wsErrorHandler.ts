// import WebSocket library
import WebSocket from "ws";
// import error classes and type guards
import { isMongoWriteError, isMongooseCastError, BAD_MESSAGE, SERVER_ERROR } from "./index";
import { MongoBulkWriteError } from "mongodb";

// function which catches any error related to WebSocket messages and sends a response message with the appropriate error status code, message, and related data (if any)
const wsErrorHandler = (error: unknown, ws: WebSocket, action: unknown) => {
  if (!action || typeof action !== "string") action = "invalid";

  if (
    error instanceof MongoBulkWriteError &&
    error.code === 11000 &&
    Array.isArray(error.writeErrors) &&
    error.writeErrors.length > 0
  ) {
    // if error is a MongoDB Duplicate Value error for a batch operation (such as attempting to insert multiple documents where one has a duplicate id)
    console.error(
      `Action: ${action}\nMongoDB Duplicate Value Error: Batch operation aborted - Cannot insert duplicate value\nFor Object: ${error.writeErrors[0].err.op}`
    );
    ws.send(
      JSON.stringify({
        action,
        success: false,
        msg: BAD_MESSAGE,
      })
    );
  } else if (isMongoWriteError(error) && error.code === 11000) {
    // if error is a MongoDB Duplicate Value error for a non-batch operation (such as attempting to insert a document which has a duplicate id)
    console.error(
      `Action: ${action}\nMongoDB Duplicate Value Error: Cannot insert duplicate value - Field: ${
        Object.keys(error.keyValue)[0]
      }, Value: ${Object.values(error.keyValue)[0]}`
    );
    ws.send(
      JSON.stringify({
        action,
        success: false,
        msg: BAD_MESSAGE,
      })
    );
  } else if (error instanceof Error && error.name === "ValidationError") {
    // if error is a MongoDB Validation Error (such as missing a required field)
    console.error(`Action: ${action}\nMongoDB Validation Error: ${error.message}`);
    ws.send(JSON.stringify({ action, success: false, msg: BAD_MESSAGE }));
  } else if (isMongooseCastError(error)) {
    // if error is a MongoDB Cast Error (such as attempting to set an array as a value for a non-array field)
    console.error(
      `Action: ${action}\nMongoDB Cast Error: Cannot cast ${error.valueType} value to ${error.kind} for field: ${error.path}\nFor Value: ${error.value}`
    );
    ws.send(
      JSON.stringify({
        action,
        success: false,
        msg: BAD_MESSAGE,
      })
    );
  } else if (error instanceof Error) {
    // any other Error
    console.error(`Action: ${action}\nError: ${error.message}`);
    ws.send(JSON.stringify({ action, success: false, msg: SERVER_ERROR }));
  } else {
    // error does not have an Error type
    console.error(`Action: ${action}\nError Value: ${error}`);
    ws.send(JSON.stringify({ action, success: false, msg: SERVER_ERROR }));
  }
};

export default wsErrorHandler;
