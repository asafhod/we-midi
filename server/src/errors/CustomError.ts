import { SERVER_ERROR } from "./errorMessages";

// CustomError class which extends the Error class
// All custom errors for the REST API extend this class
// Used in the httpErrorHandler middleware to distinguish the API's custom errors
// from any other errors and send the appropriate status code and client message in the response
class CustomError extends Error {
  statusCode: number = 500; // default statusCode to 500 for Internal Server Error
  clientMessage: string = SERVER_ERROR; // default clientMessage to message for Internal Server Error

  constructor(message: string) {
    super(message);
  }
}

export default CustomError;
