import { Request, Response, NextFunction } from "express";
// import error classes and type guards
import { CustomError, isMongoWriteError, isMongooseCastError, isExpressBodyParserError } from "../errors";
import { MongoBulkWriteError } from "mongodb";
// import error messages
import { BAD_REQUEST, SERVER_ERROR } from "../errors/errorMessages";

// middleware which catches any error related to http requests, logs it and any related data, and sends a response with the appropriate error status code and client message
const httpErrorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof CustomError) {
    // if error is one of this API's custom errors, send response with its corresponding status code and client message
    console.error(`Code: ${error.statusCode} ${error.constructor.name}: ${error.message}`);
    res.status(error.statusCode).json({ success: false, msg: error.clientMessage });
  } else if (
    error instanceof MongoBulkWriteError &&
    error.code === 11000 &&
    Array.isArray(error.writeErrors) &&
    error.writeErrors.length > 0
  ) {
    // if error is a MongoDB Duplicate Value error for a batch operation (such as attempting to insert multiple documents where one has a duplicate id)
    const { _id, __v, ...invalidDocument } = error.writeErrors[0].err.op; // get the invalid document (without unnecessary _id and __v fields)

    console.error(
      `Code: ${400} MongoDB Duplicate Value Error: Batch operation aborted - Cannot insert duplicate value\nFor Object: ${JSON.stringify(
        invalidDocument
      )}`
    );
    res.status(400).json({ success: false, msg: BAD_REQUEST });
  } else if (isMongoWriteError(error) && error.code === 11000) {
    // if error is a MongoDB Duplicate Value error for a non-batch operation (such as attempting to insert a document which has a duplicate id)
    console.error(
      `Code: ${400} MongoDB Duplicate Value Error: Cannot insert duplicate value - Field: ${Object.keys(error.keyValue)[0]}, Value: ${
        Object.values(error.keyValue)[0]
      }`
    );
    res.status(400).json({ success: false, msg: BAD_REQUEST });
  } else if (isExpressBodyParserError(error) && error.type === "entity.parse.failed") {
    // if error happened when middleware attempted to parse the request JSON
    console.error(`Code: ${400} Express Body Parser Error: Request body contains invalid JSON`);
    res.status(400).json({ success: false, msg: BAD_REQUEST });
  } else if (error instanceof Error && error.name === "ValidationError") {
    // if error is a MongoDB Validation Error (such as missing a required field)
    console.error(`Code: ${400} MongoDB Validation Error: ${error.message}`);
    res.status(400).json({ success: false, msg: BAD_REQUEST });
  } else if (isMongooseCastError(error)) {
    // if error is a MongoDB Cast Error (such as attempting to set an array as a value for a non-array field)
    console.error(
      `Code: ${400} MongoDB Cast Error: Cannot cast ${error.valueType} value to ${error.kind} for field: ${
        error.path
      }\nFor Value: ${JSON.stringify(error.value)}`
    );
    res.status(400).json({ success: false, msg: BAD_REQUEST });
  } else if (error instanceof Error) {
    // any other Error will trigger an Internal Server Error response
    console.error(`Code: ${500} Error: ${error.message}`);
    res.status(500).json({ success: false, msg: SERVER_ERROR });
  } else {
    // error does not have an Error type
    console.error(`Code: ${500} Error Value: ${error}`);
    res.status(500).json({ success: false, msg: SERVER_ERROR });
  }
};

export default httpErrorHandler;
