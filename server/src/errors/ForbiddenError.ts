import CustomError from "./CustomError";
import { FORBIDDEN } from "./errorMessages";

// custom error class for Forbidden
class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 403; // Forbidden error status code for response
    this.clientMessage = FORBIDDEN;
  }
}

export default ForbiddenError;
