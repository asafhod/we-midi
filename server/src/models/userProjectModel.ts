import mongoose, { Document, Schema } from "mongoose";

// define UserProject interface
interface IUserProject extends Document {
  id: string; // TODO: Change to _id and ObjectId("[the-id]")?
  userID: string; // TODO: Change to _id and ObjectId("[the-id]")?
  projectID: string; // TODO: Change to _id and ObjectId("[the-id]")?
  admin: boolean;
  trackControls: {
    trackID: number;
    volume: number;
    pan: number;
    solo: boolean;
    mute: boolean;
  }[];
}

// database schema for UserProject
const userProjectSchema = new Schema<IUserProject>({
  id: {
    type: String,
    required: [true, "Required field"],
    unique: true,
  },
  userID: {
    type: String,
    required: [true, "Required field"],
  },
  projectID: {
    type: String,
    required: [true, "Required field"],
  },
  admin: { type: Boolean, default: false },
  trackControls: {
    type: [
      {
        trackID: {
          type: Number,
          required: [true, "Required field"],
          unique: true,
        },
        volume: { type: Number, default: -16 },
        pan: { type: Number, default: 0 },
        solo: { type: Boolean, default: false },
        mute: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
});

// create model for UserProject using schema
const UserProject = mongoose.model("UserProject", userProjectSchema);

export default UserProject;
