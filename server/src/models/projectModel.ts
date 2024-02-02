import mongoose, { Document, Schema, Types } from "mongoose";

// constants
const DEFAULT_TEMPO: number = 120;
const DEFAULT_PPQ: number = 480;
export const DEFAULT_VOLUME: number = -16;

// define Note interface
export interface Note {
  noteID: number;
  midiNum: number;
  duration: number;
  noteTime: number;
  velocity: number;
}

// define Track interface
export interface Track {
  trackID: number;
  trackName: string;
  instrument: string;
  volume: number;
  pan: number;
  solo: boolean;
  mute: boolean;
  lastNoteID: number;
  notes: Note[];
}

// define Project interface
export interface Project extends Document {
  _id: Types.ObjectId;
  name: string;
  tempo: number;
  ppq: number;
  lastTrackID: number;
  tracks: Track[];
}

// database schema for Project
const projectSchema = new Schema<Project>({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, "_id is required"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  tempo: { type: Number, default: DEFAULT_TEMPO },
  ppq: { type: Number, default: DEFAULT_PPQ },
  lastTrackID: { type: Number, default: 0 },
  tracks: {
    type: [
      {
        trackID: { type: Number, required: [true, "TrackID is required"], unique: true }, // Any performance gain by removing unique constraint?
        trackName: { type: String, required: [true, "TrackName is required"] },
        instrument: { type: String, required: [true, "Instrument is required"] },
        volume: { type: Number, required: [true, "Volume is required"] },
        pan: { type: Number, required: [true, "Pan is required"] },
        solo: { type: Boolean, required: [true, "Solo value is required"] },
        mute: { type: Boolean, required: [true, "Mute value is required"] },
        lastNoteID: { type: Number, default: 0 },
        notes: {
          type: [
            {
              noteID: { type: Number, required: [true, "NoteID is required"], unique: true }, // Any performance gain by removing unique constraint?
              midiNum: { type: Number, required: [true, "MidiNum is required"] },
              duration: { type: Number, required: [true, "Duration is required"] },
              noteTime: { type: Number, required: [true, "NoteTime is required"] },
              velocity: { type: Number, required: [true, "Velocity is required"] },
            },
          ],
          default: [],
        },
      },
    ],
    default: [],
  },
});

// create model for Project using schema
const ProjectModel = mongoose.model("Project", projectSchema);

export default ProjectModel;
