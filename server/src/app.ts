import express, { Request, Response } from "express";
import mongoose from "mongoose";
import * as dotenv from "dotenv";

// initialize environment variables
dotenv.config();

// import routers
import usersRouter from "./routes/users";
import projectsRouter from "./routes/projects";

// import middleware
import errorHandler from "./middleware/errorHandler";
import routeNotFound from "./middleware/routeNotFound";

// initialize Express
const app = express();

// middleware
app.use(express.static("public"));
app.use(express.json());

// routes
app.use("/users");
app.use("/projects");
app.use(routeNotFound);

// error handler
app.use(errorHandler);

// @ts-ignore Currently not using req
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// retrieve and validate database URI environment variable
const mongoDbURI: string | undefined = process.env.MONGODB_URI;
if (!mongoDbURI) {
  console.error("Could not connect to database. The environment variable MONGODB_URI is not defined.");
  process.exit(1);
}

// get port on server from environment variable
const port: string | undefined = process.env.PORT || "5000";

// connect to database
mongoose
  .connect(mongoDbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`WeMidi server is listening on port ${port}...`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
