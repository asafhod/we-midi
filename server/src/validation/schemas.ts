// TODO: Update these to match Project, User, and ProjectUser models. For the User one, make sure lines up with Cognito and MongoDB. Update accordingly in Validator middleware.
import Joi, { ObjectSchema, ArraySchema } from "joi";

// validation schema for the Add Project request
export const addProjectSchema: ObjectSchema<any> = Joi.object({
  id: Joi.string().length(2).required(),
  names: Joi.array().min(1).items(Joi.string().min(1).max(75)).required(),
  languages: Joi.array().items(Joi.string().min(1).max(50)),
  regions: Joi.array().items(Joi.string().min(1).max(50)),
  orgs: Joi.array().items(Joi.string().min(1).max(50)),
  population: Joi.number().min(0).max(5000000000),
  gdp: Joi.number().min(0).max(50000000000000),
  flag: Joi.string().max(6),
});

// validation schema for the Add Projects request
export const addProjectsSchema: ArraySchema<any[]> = Joi.array()
  .min(1)
  .items({
    id: Joi.string().length(2).required(),
    names: Joi.array().min(1).items(Joi.string().min(1).max(75)).required(),
    languages: Joi.array().items(Joi.string().min(1).max(50)),
    regions: Joi.array().items(Joi.string().min(1).max(50)),
    orgs: Joi.array().items(Joi.string().min(1).max(50)),
    population: Joi.number().min(0).max(5000000000),
    gdp: Joi.number().min(0).max(50000000000000),
    flag: Joi.string().max(6),
  });

// validation schema for the Update Project request
export const updateProjectSchema: ObjectSchema<any> = Joi.object({
  id: Joi.string().length(2),
  names: Joi.array().min(1).items(Joi.string().min(1).max(75)),
  languages: Joi.array().items(Joi.string().min(1).max(50)),
  regions: Joi.array().items(Joi.string().min(1).max(50)),
  orgs: Joi.array().items(Joi.string().min(1).max(50)),
  population: Joi.number().min(0).max(5000000000),
  gdp: Joi.number().min(0).max(50000000000000),
  flag: Joi.string().max(6),
});

// validation schema for the Login and Register User requests
export const userLoginRegSchema: ObjectSchema<any> = Joi.object({
  username: Joi.string().min(5).max(25).required(),
  password: Joi.string().min(5).max(25).required(),
});
