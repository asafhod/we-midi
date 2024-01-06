import mongoose, { Document, Schema, Types } from "mongoose";

// define Project interface
export interface Project extends Document {
  _id: Types.ObjectId;
  name: string;
  midiFile: Buffer;
  trackIDs: number[];
  lastTrackID: number;
  trackControls: {
    trackID: number;
    volume: number;
    pan: number;
    solo: boolean;
    mute: boolean;
  }[];
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
  midiFile: {
    type: Buffer,
    default: null,
  },
  trackIDs: { type: [Number], default: [] },
  lastTrackID: { type: Number, default: 0 },
  trackControls: {
    type: [
      {
        trackID: {
          type: Number,
          required: [true, "TrackControl TrackID is required"],
          unique: true,
        },
        volume: { type: Number, required: [true, "Project TrackControl Volume is required"] },
        pan: { type: Number, required: [true, "Project TrackControl Pan is required"] },
        solo: { type: Boolean, required: [true, "Project TrackControl Solo is required"] },
        mute: { type: Boolean, required: [true, "Project TrackControl Mute is required"] },
      },
    ],
    default: [],
  },
});

// create model for Project using schema
const ProjectModel = mongoose.model("Project", projectSchema);

export default ProjectModel;
