import express from "express";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import AWS from "aws-sdk";
import usersRouter from "./routes/users";
import projectsRouter from "./routes/projects";
import projectUsersRouter from "./routes/projectUsers";
import errorHandler from "./middleware/errorHandler";
import routeNotFound from "./middleware/routeNotFound";

// initialize environment variables
dotenv.config();

// retrieve environment variables
const { MONGODB_URI, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const PORT: string = process.env.PORT || "5000"; // default port to 5000

// validate environment variables
if (!MONGODB_URI || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("Environment variables MONGODB_URI, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are required.");
  process.exit(1);
}

// initialize Express
const app = express();

// configure AWS SDK (TODO: If deploying on EC2, get this from IAM roles instead)
AWS.config.update({ region: AWS_REGION, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });

// middleware
app.use(express.static("public"));
app.use(express.json());

// routes
app.use("/users", usersRouter);
app.use("/projects", projectsRouter);
app.use("/projectUsers", projectUsersRouter);
app.use(routeNotFound);

// error handler
app.use(errorHandler);

// connect to database
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`WeMidi server is listening on port ${PORT}...`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
