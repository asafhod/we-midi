import CustomError from "./CustomError";

// custom error class for Bad Request
class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 400; // Bad Request error status code for response
  }
}

export default BadRequestError;
