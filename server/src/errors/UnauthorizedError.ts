import CustomError from "./CustomError";

// custom error class for Unauthorized
class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 401; // Unauthorized error status code for response
  }
}

export default UnauthorizedError;
