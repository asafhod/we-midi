import { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import webSocketManager from "../webSocketManager";
import ProjectModel from "../models/projectModel";
import {
  addProjectSchema,
  updateProjectSchema,
  importMidiSchema,
  changeTempoSchema,
  updateTrackSchema,
  deleteTrackSchema,
} from "../validation/schemas";
import { BadRequestError, BadMessageError, NotFoundError } from "../errors";
import { SERVER_ERROR } from "../errors/errorMessages";
// Do I need formatQueryArray? Or can I somehow extract the right kind of array directly from the query params? Or at least extract as array instead of string to save formatQueryArray a step?
import { formatQueryArray } from "./helpers";

// TODO: Make sure aligns with TypeScript. What type to give the query results variables? Do I type the responses? Ask ChatGPT.
//       Do you need to use toObject() or not?
// getProjects, getProject, addProject, updateProject, deleteProject
// import MIDI
// change tempo
// update track, delete track, [add track]

// get projects based on url query arguments
export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure url query arguments from request
    const { ids, names, languages, regions, orgs, pop_min, pop_max, gdp_min, gdp_max } = req.query;

    // initialize query to empty object
    const query = {};

    // set up query object for arguments that correspond to array fields on the Project model
    if (ids) {
      // format argument into array
      const idsArray = formatQueryArray(ids);
      // set query field for argument with the "$in" property to allow querying based on all of the array entries
      query.id = { $in: idsArray };
    }

    if (names) {
      const namesArray = formatQueryArray(names);
      query.names = { $in: namesArray };
    }

    if (languages) {
      const langsArray = formatQueryArray(languages);
      query.languages = { $in: langsArray };
    }

    if (regions) {
      const regionsArray = formatQueryArray(regions);
      query.regions = { $in: regionsArray };
    }

    if (orgs) {
      const orgsArray = formatQueryArray(orgs);
      query.orgs = { $in: orgsArray };
    }

    // set up query object for arguments that correspond to non-array fields on Project model
    if (pop_min) {
      // cast string argument to number and set up query field with the greater-than-or-equal-to flag ($gte)
      query.population = { $gte: Number(pop_min) };
    }

    if (pop_max) {
      // set up query field for argument with the less-than-or-equal-to flag ($lte)
      query.population = { ...query.population, $lte: Number(pop_max) };
    }

    if (gdp_min) {
      query.gdp = { $gte: Number(gdp_min) };
    }

    if (gdp_max) {
      query.gdp = { ...query.gdp, $lte: Number(gdp_max) };
    }

    // query the database using the query object (an empty object returns all projects)
    const projects = await ProjectModel.find(query, { __v: 0 }); // use projection to avoid retrieving unnecessary field __v

    // respond successfully with result count and project data
    res.status(200).json({
      success: true,
      resultCount: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error); // pass any thrown error to error handler middleware
  }
};

// get project by id (ws)
export const getProject = async (ws: WebSocket, projectID: string) => {
  try {
    // query database for project using id
    const project = await ProjectModel.findOne({ _id: projectID.toLowerCase() }, { __v: 0 });
    if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

    // TODO: Retrieve any additional needed data, such anything needed from ProjectUsers or Users
    //       Also include the currently online usernames for the project (using Object.keys(webSocketManager[projectID]))

    // respond successfully with project data
    ws.send(JSON.stringify({ action: "getProject", success: true, data: project.toObject() }));
  } catch (error) {
    console.error(error);
    // project could not be retrieved for the client, close its WebSocket connection with a Server Error message
    ws.close(1008, SERVER_ERROR);
  }
};

// add project
export const addProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate request body with Joi schema
    const { error } = addProjectSchema.validate(req.body, { abortEarly: false });
    if (error) throw new BadRequestError(String(error));

    // insert new project into database based on json in request body
    const project = await ProjectModel.create(req.body);

    // log successful project addition to the console
    console.log(`User ${req.username} added project: ${req.body.id}`);

    // respond successfully with project data
    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        names: project.names,
        languages: project.languages,
        regions: project.regions,
        orgs: project.orgs,
        population: project.population,
        gdp: project.gdp,
      },
    });
  } catch (error) {
    next(error);
  }
};

// update project (ws)
export const updateProject = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateProjectSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // update project matching projectID in the database based on data, using "new" flag to retrieve the updated entry
  const project = await ProjectModel.findOneAndUpdate({ _id: projectID.toLowerCase() }, data, { new: true, projection: { __v: 0 } });
  if (!project) throw new NotFoundError(`No project found for ID: ${projectID}`);

  // log successful project update to the console
  console.log(`User ${username} updated project: ${projectID}`);

  // respond successfully with project data
  ws.send(JSON.stringify({ action: "updateProject", success: true, data: project.toObject() }));
};

// import MIDI (ws)
export const importMidi = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = importMidiSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // TODO: Which data gets sent back (same question for similar project-editing controllers)?
  // respond successfully with project data
  ws.send(JSON.stringify({ action: "importMidi", success: true, data: project.toObject() }));
};

// change tempo (ws)
export const changeTempo = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = changeTempoSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with project data
  ws.send(JSON.stringify({ action: "changeTempo", success: true, data: project.toObject() }));
};

// add track (ws)
export const addTrack = async (ws: WebSocket, projectID: string, username: string) => {
  // respond successfully with project data
  ws.send(JSON.stringify({ action: "addTrack", success: true, data: project.toObject() }));
};

// update track (ws)
export const updateTrack = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = updateTrackSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with project data
  ws.send(JSON.stringify({ action: "updateTrack", success: true, data: project.toObject() }));
};

// delete track (ws)
export const deleteTrack = async (ws: WebSocket, projectID: string, username: string, data: any) => {
  // validate data with Joi schema
  const { error } = deleteTrackSchema.validate(data, { abortEarly: false });
  if (error) throw new BadMessageError(String(error));

  // respond successfully with project data
  ws.send(JSON.stringify({ action: "deleteTrack", success: true, data: project.toObject() }));
};

// delete project (ws)
export const deleteProject = async (ws: WebSocket, projectID: string, username: string) => {
  // TODO: Implement
  // TODO: Disconnect all WS clients currently working on the project
};

// delete project
export const deleteProjectHttp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // delete project matching id parameter in database
    const project = await ProjectModel.findOneAndDelete({ _id: id.toLowerCase() }, { projection: { __v: 0 } });
    if (!project) throw new NotFoundError(`No project found for ID: ${id}`);

    // log successful project deletion to the console
    console.log(`User ${req.username} deleted project: ${id}`);

    // respond successfully
    res.sendStatus(204);

    // TODO: Disconnect all WS clients currently working on the project
  } catch (error) {
    next(error);
  }
};
