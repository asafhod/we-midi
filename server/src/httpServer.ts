import express from "express";
import http from "http";
import usersRouter from "./routes/users";
import projectsRouter from "./routes/projects";
import projectUsersRouter from "./routes/projectUsers";
import httpErrorHandler from "./middleware/httpErrorHandler";
import routeNotFound from "./middleware/routeNotFound";
// TODO: Import security middleware

export const configureHttpServer = (app: express.Application) => {
  // middleware
  // TODO: Security middleware
  app.use(express.static("public"));
  app.use(express.json());
  // TODO: Security middleware

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
