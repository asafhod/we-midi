import express from "express";
import http from "http";
import usersRouter from "./routes/users";
import projectsRouter from "./routes/projects";
import projectUsersRouter from "./routes/projectUsers";
import httpErrorHandler from "./middleware/httpErrorHandler";
import routeNotFound from "./middleware/routeNotFound";
import helmet from "helmet";
import cors from "cors";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";

export const configureHttpServer = (app: express.Application) => {
  // middleware
  app.set("trust proxy", 1); // use reverse proxy's settings
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // limit each IP to 100 HTTP requests per 15 minutes

  app.use(express.static("public"));
  app.use(express.json());

  app.use(helmet()); // HTTP header security
  app.use(cors()); // enable cross-origin resource sharing
  app.use(xss()); // sanitize HTML to prevent cross-site scripting attacks

  // routes
  app.use("/users", usersRouter);
  app.use("/projects", projectsRouter);
  app.use("/projectUsers", projectUsersRouter);
  app.use(routeNotFound);

  // error handler
  app.use(httpErrorHandler);

  // TODO: Change to https with cert and key
  const server: http.Server = http.createServer(app);

  return server;
};
