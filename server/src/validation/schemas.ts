import Joi, { ObjectSchema, ArraySchema } from "joi";

// validation schema for the Update User request
export const updateUserSchema: ObjectSchema<any> = Joi.object({
  isAdmin: Joi.boolean(),
});

// validation schema for the Add Project request
export const addProjectSchema: ObjectSchema<any> = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  midiFile: Joi.binary(),
  trackIDs: Joi.array().max(100).items(Joi.number().min(1)).unique(),
  lastTrackID: Joi.number().min(0),
  trackControls: Joi.array().items({
    trackID: Joi.number().min(1).required(),
    volume: Joi.number().min(-40).max(8).required(),
    pan: Joi.number().min(-8).max(8).required(),
    solo: Joi.boolean().required(),
    mute: Joi.boolean().required(),
  }),
});

// validation schema for the Update Project request
export const updateProjectSchema: ObjectSchema<any> = Joi.object({
  name: Joi.string().min(1).max(100),
  midiFile: Joi.binary(),
  trackIDs: Joi.array().max(100).items(Joi.number().min(1)).unique(),
  lastTrackID: Joi.number().min(0),
  trackControls: Joi.array().items({
    // TODO: If you implement granular trackControl and trackControl value updates, would likely make the values not required
    //       Also, would possibly send a trackControlTrackID to identify which one, and a trackControl object with only the values being updated
    trackID: Joi.number().min(1).required(),
    volume: Joi.number().min(-40).max(8).required(),
    pan: Joi.number().min(-8).max(8).required(),
    solo: Joi.boolean().required(),
    mute: Joi.boolean().required(),
  }),
});

// validation schema for the Add Project User request
export const addProjectUserSchema: ObjectSchema<any> = Joi.object({
  projectID: Joi.string().hex().length(24).required(),
  username: Joi.string().min(1).max(128).required(),
  isProjectAdmin: Joi.boolean(),
  trackControls: Joi.array().items({
    trackID: Joi.number().min(1).required(),
    volume: Joi.number().min(-40).max(8).required(),
    pan: Joi.number().min(-8).max(8).required(),
    solo: Joi.boolean().required(),
    mute: Joi.boolean().required(),
  }),
});

// TODO: Validate projectID and username in the controller. ProjectID needs to be a string, hex, length 24, and required. Username needs to be a string, min 1, max 128, and required.
// validation schema for the Update Project User request
export const updateProjectUserSchema: ObjectSchema<any> = Joi.object({
  // intentionally left off isProjectAdmin because this request is used to self-update
  // TODO: If you implement granular trackControl and trackControl value updates, would likely make the values not required
  //       Also, would possibly send a trackControlTrackID to identify which one, and a trackControl object with only the values being updated
  trackControls: Joi.array().items({
    trackID: Joi.number().min(1).required(),
    volume: Joi.number().min(-40).max(8).required(),
    pan: Joi.number().min(-8).max(8).required(),
    solo: Joi.boolean().required(),
    mute: Joi.boolean().required(),
  }),
});

// validation schema for the Add Project Users request
export const addProjectUsersSchema: ArraySchema<any[]> = Joi.array()
  .min(1)
  .max(10)
  .items({
    projectID: Joi.string().hex().length(24).required(),
    username: Joi.string().min(1).max(128).required(),
    isProjectAdmin: Joi.boolean(),
    trackControls: Joi.array().items({
      trackID: Joi.number().min(1).required(),
      volume: Joi.number().min(-40).max(8).required(),
      pan: Joi.number().min(-8).max(8).required(),
      solo: Joi.boolean().required(),
      mute: Joi.boolean().required(),
    }),
  });

// validation schema for the Update Project Users request
export const updateProjectUsersSchema: ArraySchema<any[]> = Joi.array()
  .min(1)
  .max(10)
  .items({
    projectID: Joi.string().hex().length(24).required(),
    username: Joi.string().min(1).max(128).required(),
    isProjectAdmin: Joi.boolean(),
    // intentionally left off trackControls because this request is used to update permissions
  });
