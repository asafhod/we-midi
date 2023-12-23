import mongoose, { Document, Schema, Types } from "mongoose";

// define Project interface
interface IProject extends Document {
  _id: Types.ObjectId;
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
