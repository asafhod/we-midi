import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import ProjectModel from "../models/projectModel";
import { NotFoundError, BadRequestError } from "../errors";
// Do I need formatQueryArray? Or can I somehow extract the right kind of array directly from the query params? Or at least extract as array instead of string to save formatQueryArray a step?
import { formatQueryArray } from "./helpers";

// TODO: Make sure aligns with TypeScript. What type to give the query results variables? Do I type the responses? Ask ChatGPT.
// getProjects, getProject, addProject, updateProject, deleteProject

// get countries based on url query arguments
export const getCountries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure url query arguments from request
    const { ids, names, languages, regions, orgs, pop_min, pop_max, gdp_min, gdp_max } = req.query;

    // initialize query to empty object
    const query = {};

    // set up query object for arguments that correspond to array fields on the Country model
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

    // set up query object for arguments that correspond to non-array fields on Country model
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

    // query the database using the query object (an empty object returns all countries)
    const countries = await Country.find(query, { _id: 0, __v: 0 }); // use projection to avoid retrieving unnecessary fields _id and __v

    // prepend path to flags folder on server for each country's flag value in order to get the actual flag url
    for (const country of countries) {
      country.flag = `${baseUrl}/flags/${country.flag}`;
    }

    // respond successfully with result count and country data
    res.status(200).json({
      success: true,
      resultCount: countries.length,
      data: countries,
    });
  } catch (error) {
    next(error); // pass any thrown error to error handler middleware
  }
};

// get country by id
export const getCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // destructure country id from url parameter
    const { id } = req.params;

    // query database for country using id
    const country = await Country.findOne({ id: id.toLowerCase() }, { _id: 0, __v: 0 });
    if (!country) throw new NotFoundError(`No country found for ID: ${id}`);

    // respond successfully with country data
    res.status(200).json({
      success: true,
      data: { ...country.toObject(), flag: `${baseUrl}/flags/${country.flag}` },
    });
  } catch (error) {
    next(error);
  }
};

// add country (user only)
export const addCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // insert new country into database based on json in request body
    const country = await Country.create(req.body);

    // log successful country addition to the console
    console.log(`User ${req.username} added country: ${req.body.id}`);

    // respond successfully with country data
    res.status(201).json({
      success: true,
      data: {
        id: country.id,
        names: country.names,
        languages: country.languages,
        regions: country.regions,
        orgs: country.orgs,
        population: country.population,
        gdp: country.gdp,
        flag: `${baseUrl}/flags/${country.flag}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// add multiple countries (user only)
export const addCountries = async (req: Request, res: Response, next: NextFunction) => {
  // set up transaction for batch insert operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // insert new countries into database based on json in request body (using transaction)
    const result = await Country.insertMany(req.body, { session });

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // format country count message
    const countryCount = result.length === 1 ? "1 country" : `${result.length} countries`;

    // log successful batch country addition to the console
    console.log(`User ${req.username} added ${countryCount}`);

    // respond successfully with message showing how many countries were added
    res.status(201).json({
      success: true,
      msg: `${countryCount} added`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// update country (user only)
export const updateCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // update country matching id parameter in the database based on json in request body, using "new" flag to retrieve the updated entry
    const country = await Country.findOneAndUpdate({ id: id.toLowerCase() }, req.body, { new: true, projection: { _id: 0, __v: 0 } });
    if (!country) throw new NotFoundError(`No country found for ID: ${id}`);

    // log successful country update to the console
    console.log(`User ${req.username} updated country: ${id}`);

    // respond successfully with country data
    res.status(200).json({
      success: true,
      data: { ...country.toObject(), flag: `${baseUrl}/flags/${country.flag}` },
    });
  } catch (error) {
    next(error);
  }
};

// delete country (user only)
export const deleteCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // delete country matching id parameter in database
    const country = await Country.findOneAndDelete({ id: id.toLowerCase() }, { projection: { _id: 0, __v: 0 } });
    if (!country) throw new NotFoundError(`No country found for ID: ${id}`);

    // log successful country deletion to the console
    console.log(`User ${req.username} deleted country: ${id}`);

    // respond successfully
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

// delete all countries (user only)
export const deleteCountries = async (req: Request, res: Response, next: NextFunction) => {
  // set up transaction for batch delete operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // delete all countries from database (using transaction)
    const result = await Country.deleteMany({}, { session });

    // if successful, commit and end the transaction
    await session.commitTransaction();
    session.endSession();

    // format country count message
    const countryCount = result.deletedCount === 1 ? "1 country" : `${result.deletedCount} countries`;

    // log successful batch country deletion to the console
    console.log(`User ${req.username} deleted ${countryCount}`);

    // respond successfully with message showing how many countries were deleted
    res.status(200).json({
      success: true,
      msg: `${countryCount} deleted`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
