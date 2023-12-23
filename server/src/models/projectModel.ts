import mongoose, { Document, Schema } from "mongoose";

// define Project interface
interface IProject extends Document {
  id: string; // TODO: Change to _id and ObjectId("[the-id]")?
  name: string;
  midiFile: {
    data: Buffer;
    filename: string;
  };
  metadata: {
    trackIDs: number[];
    lastTrackID: number;
  };
}

// database schema for Project
const projectSchema = new Schema<IProject>({
  id: {
    type: String,
    required: [true, "Required field"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Required field"],
  },
  midiFile: {
    type: {
      data: { type: Buffer, default: null },
      filename: { type: String, default: "" },
    },
    default: null,
  },
  metadata: {
    type: {
      trackIDs: { type: [Number], default: [] },
      lastTrackID: { type: Number, default: 0 },
    },
    default: null,
  },
});

// create model for Project using schema
const Project = mongoose.model("Project", projectSchema);

export default Project;
