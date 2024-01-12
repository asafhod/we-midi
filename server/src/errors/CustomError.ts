import { SERVER_ERROR } from "./errorMessages";

// CustomError class which extends the Error class. All of the custom errors extend this class.
// Used in httpErrorHandler and wsErrorHandler to distinguish the custom errors from any
// other errors and to send the appropriate status code and/or client message in the response
class CustomError extends Error {
  statusCode: number = 500; // default statusCode to 500 for Internal Server Error
  clientMessage: string = SERVER_ERROR; // default clientMessage to message for Internal Server Error

  constructor(message: string) {
    super(message);
  }
}

export default CustomError;
