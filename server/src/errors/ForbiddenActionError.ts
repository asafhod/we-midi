import CustomError from "./CustomError";
import { FORBIDDEN_ACTION } from "./errorMessages";

// custom error class for Forbidden Action
class ForbiddenActionError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 4003; // Forbidden Action error status code
    this.clientMessage = FORBIDDEN_ACTION;
  }
}

export default ForbiddenActionError;
