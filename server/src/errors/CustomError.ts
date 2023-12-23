// CustomError class which extends the Error class
// All custom errors for this API extend this class
// Used in the error handler middleware to distinguish this API's custom errors from any other errors
class CustomError extends Error {
  statusCode: number = 500; // default statusCode to 500 (Internal Server Error)

  constructor(message: string) {
    super(message);
  }
}

export default CustomError;
