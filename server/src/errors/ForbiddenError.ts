import CustomError from "./CustomError";

// custom error class for Forbidden
class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 403; // Forbidden error status code for response
  }
}

export default ForbiddenError;
