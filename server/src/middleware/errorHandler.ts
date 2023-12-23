import { Request, Response, NextFunction } from "express";
// import error classes and type guards
import { CustomError, isMongoWriteError, isMongooseCastError, isExpressBodyParserError } from "../errors";
import { MongoBulkWriteError } from "mongodb";

// middleware which catches all errors and sends response with appropriate error status code and message
const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof CustomError) {
    // if error is one of this API's custom errors, send response with its corresponding status code and message
    res.status(error.statusCode).json({ success: false, msg: error.message });
  } else if (
    error instanceof MongoBulkWriteError &&
    error.code === 11000 &&
    Array.isArray(error.writeErrors) &&
    error.writeErrors.length > 0
  ) {
    // if error is a MongoDB Duplicate Value error for a batch operation (such as attempting to insert multiple documents where one has a duplicate id)
    res.status(400).json({
      success: false,
      msg: "Batch operation aborted: Cannot insert duplicate value",
      data: error.writeErrors[0].err.op, // object which triggered the Duplicate Value error and caused the operation to be aborted
    });
  } else if (isMongoWriteError(error) && error.code === 11000) {
    // if error is a MongoDB Duplicate Value error for a non-batch operation (such as attempting to insert a document which has a duplicate id)
    res.status(400).json({
      success: false,
      msg: `Cannot insert duplicate value - Field: ${Object.keys(error.keyValue)[0]}, Value: ${Object.values(error.keyValue)[0]}`,
    });
  } else if (isExpressBodyParserError(error) && error.type === "entity.parse.failed") {
    // if error happened when middleware attempted to parse the request JSON
    res.status(400).json({
      success: false,
      msg: "Request body contains invalid JSON",
    });
  } else if (error.name === "ValidationError") {
    // if error is a MongoDB Validation Error (such as missing a required field)
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  } else if (isMongooseCastError(error)) {
    // if error is a MongoDB Cast Error (such as attempting to set an array as a value for a non-array field)
    res.status(400).json({
      success: false,
      msg: `Cannot cast ${error.valueType} value to ${error.kind} for field: ${error.path}`,
      value: error.value, // value which triggered the Cast Error
    });
  } else {
    // any other error will trigger an Internal Server Error response
    console.error(error); // log the error to the console for analysis
    res.status(500).json({ success: false, msg: "Server error - Please try again later" });
  }
};

export default errorHandler;
