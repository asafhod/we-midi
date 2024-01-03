// import and initialize environment variables
import dotenv from "dotenv";
dotenv.config();

// import Express, Mongoose, and server modules
import express from "express";
import mongoose from "mongoose";
import AWS from "aws-sdk";
import http from "http";
import { configureHttpServer } from "./httpServer";
import { configureWsServer } from "./wsServer";

// retrieve environment variables
const PORT: string = process.env.PORT || "5000"; // default port to 5000
const { MONGODB_URI, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

// validate environment variables
if (!MONGODB_URI || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("Environment variables MONGODB_URI, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are required.");
  process.exit(1);
}

// configure AWS SDK (TODO: If deploying on EC2, get this from IAM roles instead)
AWS.config.update({ region: AWS_REGION, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });

// initialize Express
const app = express();

// create and configure http server
const server: http.Server = configureHttpServer(app);

// integrate and configure WebSocket server
configureWsServer(server);

// connect to database
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // start the server
    server.listen(PORT, () => {
      console.log(`WeMidi server is listening on port ${PORT}...`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
