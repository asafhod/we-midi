import express from "express";
import http from "http";
import usersRouter from "./routes/users";
import projectsRouter from "./routes/projects";
import projectUsersRouter from "./routes/projectUsers";
import errorHandler from "./middleware/errorHandler";
import routeNotFound from "./middleware/routeNotFound";

export const configureHttpServer = (app: express.Application) => {
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

  const server: http.Server = http.createServer(app);

  return server;
};
