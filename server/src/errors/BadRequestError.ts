import CustomError from "./CustomError";
import { BAD_REQUEST } from "./errorMessages";

// custom error class for Bad Request
class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 400; // Bad Request error status code for response
    this.clientMessage = BAD_REQUEST;
  }
}

export default BadRequestError;
