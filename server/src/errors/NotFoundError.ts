import CustomError from "./CustomError";

// custom error class for Not Found
class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message);
    this.statusCode = 404; // Not Found error status code for response
  }
}

export default NotFoundError;
