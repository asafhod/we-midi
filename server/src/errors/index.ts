// import all custom errors
import CustomError from "./CustomError";
import BadRequestError from "./BadRequestError";
import UnauthorizedError from "./UnauthorizedError";
import ForbiddenError from "./ForbiddenError";
import NotFoundError from "./NotFoundError";

// import error type guards
import { isMongoWriteError, isMongooseCastError, isExpressBodyParserError } from "./types";

// named export all custom errors and type guards from this index.ts file so they can be imported from the "/errors" path as needed
export {
  CustomError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  isMongoWriteError,
  isMongooseCastError,
  isExpressBodyParserError,
};
