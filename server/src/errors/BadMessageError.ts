import CustomError from "./CustomError";
import { BAD_MESSAGE } from "./errorMessages";

// custom error class for Bad Message
class BadMessageError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 4000; // Bad Message error status code
    this.clientMessage = BAD_MESSAGE;
  }
}

export default BadMessageError;
