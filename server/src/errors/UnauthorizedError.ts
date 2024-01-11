import CustomError from "./CustomError";
import { UNAUTHORIZED } from "./errorMessages";

// custom error class for Unauthorized
class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 401; // Unauthorized error status code for response
    this.clientMessage = UNAUTHORIZED;
  }
}

export default UnauthorizedError;
