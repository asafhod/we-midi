import CustomError from "./CustomError";
import { NOT_FOUND } from "./errorMessages";

// custom error class for Not Found
class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 404; // Not Found error status code for response
    this.clientMessage = NOT_FOUND;
  }
}

export default NotFoundError;
