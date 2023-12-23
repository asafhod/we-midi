import { WriteError } from "mongodb";
import { Error as MongooseError } from "mongoose";

// interfaces to extend MongoDB, Mongoose, and Express error types with missing runtime properties used in error handling
interface MongoWriteError extends WriteError {
  keyValue: Record<string, any>;
}

interface MongooseCastError extends MongooseError.CastError {
  valueType: string;
}

interface ExpressBodyParserError extends Error {
  type: string;
}

// type guards to enforce the error types at runtime
export const isMongoWriteError = (error: any): error is MongoWriteError => {
  return error instanceof WriteError && "keyValue" in error && typeof error.keyValue === "object";
};

export const isMongooseCastError = (error: any): error is MongooseCastError => {
  return error instanceof MongooseError.CastError && "valueType" in error && typeof error.valueType === "string";
};

export const isExpressBodyParserError = (error: any): error is ExpressBodyParserError => {
  return "type" in error && typeof error.type === "string";
};
