import Joi, { ObjectSchema, ArraySchema } from "joi";

// TODO: Change numberical constants and tempo logic when you change note timing to measure-based

// constants
const instrumentCodes: string[] = ["p", "g", "e", "b", "d", "c"]; // piano, guitar, electric guitar, bass, drums, chiptune

// validation schema for the Update User request
export const updateUserSchema: ObjectSchema<any> = Joi.object({
  // Note: Cognito custom attribute update logic for the Update User request only supports string, number, and boolean values
  isAdmin: Joi.boolean(),
});

// validation schema for the Add Project request
export const addProjectSchema: ObjectSchema<any> = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});

// validation schema for the Update Project request
export const updateProjectSchema: ObjectSchema<any> = Joi.object({
  name: Joi.string().min(1).max(100),
  tempo: Joi.number().min(1).max(300),
});

// validation schema for the Import MIDI request
export const importMidiSchema: ObjectSchema<any> = Joi.object({
  tempo: Joi.number().min(1).max(300).required(),
  ppq: Joi.number().min(24).max(960).required(),
  tracks: Joi.array()
    .max(100)
    .items({
      trackName: Joi.string().min(1).max(15).required(),
      instrument: Joi.string()
        .valid(...instrumentCodes)
        .required(),
      volume: Joi.number().min(-40).max(8).required(),
      pan: Joi.number().min(-8).max(8).required(),
      solo: Joi.boolean().required(),
      mute: Joi.boolean().required(),
      lastNoteID: Joi.number().min(0), // TODO: This should be notes.length (handle on client)
      notes: Joi.array()
        .max(1500)
        .items({
          noteID: Joi.number().min(1).required(), // TODO: Handle on client. Just increment, starting at 1.
          midiNum: Joi.number().min(21).max(108).required(),
          duration: Joi.number().min(0.00625).max(60000).required(),
          noteTime: Joi.number().min(0).max(59998.125).required(),
          velocity: Joi.number().min(0).max(127).required(),
        }),
    })
    .required(),
});

// validation for the Update Track request
export const updateTrackSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  trackName: Joi.string().min(1).max(15),
  instrument: Joi.string().valid(...instrumentCodes),
  volume: Joi.number().min(-40).max(8),
  pan: Joi.number().min(-8).max(8),
  solo: Joi.boolean(),
  mute: Joi.boolean(),
});

// validation for the Delete Track request
export const deleteTrackSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
});

// validation for the Add Note request
export const addNoteSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  clientNoteID: Joi.number().min(0).required(),
  midiNum: Joi.number().min(21).max(108).required(),
  duration: Joi.number().min(0.00625).max(60000).required(),
  noteTime: Joi.number().min(0).max(59998.125).required(),
  velocity: Joi.number().min(0).max(127).required(),
});

// validation for the Add Notes request
export const addNotesSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  notes: Joi.array()
    .min(2)
    // .max(1500) TODO: Enforce with check on client that doesn't allow the amount of new notes plus the amount of existing ones for the track (notes.length) to exceed 1500
    .items({
      clientNoteID: Joi.number().min(0).required(),
      midiNum: Joi.number().min(21).max(108).required(),
      duration: Joi.number().min(0.00625).max(60000).required(),
      noteTime: Joi.number().min(0).max(59998.125).required(),
      velocity: Joi.number().min(0).max(127).required(),
    })
    .required(),
});

// validation for the Update Note request
export const updateNoteSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  noteID: Joi.number().min(1).required(),
  midiNum: Joi.number().min(21).max(108).required(),
  duration: Joi.number().min(0.00625).max(60000).required(),
  noteTime: Joi.number().min(0).max(59998.125).required(),
  velocity: Joi.number().min(0).max(127).required(),
});

// validation for the Update Notes request
export const updateNotesSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  notes: Joi.array()
    .min(2)
    .max(1500)
    .items({
      noteID: Joi.number().min(1).required(),
      midiNum: Joi.number().min(21).max(108).required(),
      duration: Joi.number().min(0.00625).max(60000).required(),
      noteTime: Joi.number().min(0).max(59998.125).required(),
      velocity: Joi.number().min(0).max(127).required(),
    })
    .required(),
});

// validation for the Delete Note request
export const deleteNoteSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  noteID: Joi.number().min(1).required(),
});

// validation for the Delete Notes request
export const deleteNotesSchema: ObjectSchema<any> = Joi.object({
  trackID: Joi.number().min(1).required(),
  noteIDs: Joi.array().min(2).max(1499).items(Joi.number().min(1)).required(),
});

// validation schema for the Search Users request
export const searchUsersSchema: ObjectSchema<any> = Joi.object({
  search: Joi.string().min(1).max(128).required(),
});

// validation schema for the Add Project Users request
export const addProjectUsersSchema: ArraySchema<any[]> = Joi.array()
  .min(1)
  .max(9)
  .items({
    username: Joi.string().min(1).max(128).required(),
    isProjectAdmin: Joi.boolean().required(),
  });

// validation schema for the Update Project Users request
export const updateProjectUsersSchema: ArraySchema<any[]> = Joi.array()
  .min(1)
  .max(10)
  .items({
    username: Joi.string().min(1).max(128).required(),
    isProjectAdmin: Joi.boolean(),
  });

// validation schema for the Delete Project Users request
export const deleteProjectUsersSchema: ArraySchema<any[]> = Joi.array()
  .min(1)
  .max(9)
  .items({
    username: Joi.string().min(1).max(128).required(),
  });

// validation for the User Current View request
export const userCurrentViewSchema: ObjectSchema<any> = Joi.object({
  // trackID of 1 or higher corresponds to the track being edited in the MidiEditor view
  // trackID of 0 corresponds to the TrackEditor view
  trackID: Joi.number().min(0).required(),
  targetUser: Joi.string().min(1).max(128),
});

// validation for the User Mouse request
export const userMouseSchema: ObjectSchema<any> = Joi.object({
  top: Joi.number().min(0).required(),
  time: Joi.number().min(0).max(60000).required(),
  leftClick: Joi.boolean().required(),
  rightClick: Joi.boolean().required(),
  targetUsers: Joi.array().min(1).items(Joi.string().min(1).max(128)).required(),
});

// validation for the Chat Message request
export const chatMessageSchema: ObjectSchema<any> = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
});
