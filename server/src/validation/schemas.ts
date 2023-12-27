// TODO: Update these to match Project, User, and ProjectUser models. For the User one, make sure lines up with Cognito and MongoDB. Update accordingly in Validator middleware.
import Joi, { ObjectSchema, ArraySchema } from "joi";

/*
  addProjectUserSchema,
  updateProjectUsersSchema,
  updateProjectUserSchema
*/

// validation schema for the Update User request
export const updateUserSchema: ObjectSchema<any> = Joi.object({
  isAdmin: Joi.boolean(),
});

// validation schema for the Add Project request
export const addProjectSchema: ObjectSchema<any> = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  midiFile: Joi.binary(),
  trackIDs: Joi.array().max(100).items(Joi.number().min(1)),
  lastTrackID: Joi.number().min(0),
  trackControls: Joi.array().items(
    Joi.object({
      trackID: Joi.number().min(1).required(),
      volume: Joi.number().min(-40).max(8).required(),
      pan: Joi.number().min(-8).max(8).required(),
      solo: Joi.boolean().required(),
      mute: Joi.boolean().required(),
    })
  ),
});

// validation schema for the Update Project request
export const updateProjectSchema: ObjectSchema<any> = Joi.object({
  name: Joi.string().min(1).max(100),
  midiFile: Joi.binary(),
  trackIDs: Joi.array().max(100).items(Joi.number().min(1)),
  lastTrackID: Joi.number().min(0),
  trackControls: Joi.array().items(
    Joi.object({
      // TODO: If you implement granular trackControl and trackControl value updates, would likely make the values not required
      //       Also, would possibly send a trackControlTrackID to identify which one, and a trackControl object with only the values being updated
      trackID: Joi.number().min(1).required(),
      volume: Joi.number().min(-40).max(8).required(),
      pan: Joi.number().min(-8).max(8).required(),
      solo: Joi.boolean().required(),
      mute: Joi.boolean().required(),
    })
  ),
});

// TODO: Implement
// validation schema for the Add Project Users request
export const addProjectUsersSchema: ArraySchema<any[]> = Joi.array()
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
