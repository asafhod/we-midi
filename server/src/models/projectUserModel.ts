import mongoose, { Document, Schema, Types } from "mongoose";

// define ProjectUser interface
interface IProjectUser extends Document {
  _id: Types.ObjectId;
  projectID: Types.ObjectId;
  username: string;
  isProjectAdmin: boolean;
  trackControls: {
    trackID: number;
    volume: number;
    pan: number;
    solo: boolean;
    mute: boolean;
  }[];
}

// database schema for ProjectUser
const projectUserSchema = new Schema<IProjectUser>({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, "_id is required"],
    unique: true,
  },
  projectID: {
    type: Schema.Types.ObjectId,
    required: [true, "ProjectID is required"],
  },
  username: {
    type: String,
    required: [true, "Username is required"],
  },
  isProjectAdmin: { type: Boolean, default: false },
  trackControls: {
    type: [
      {
        trackID: {
          type: Number,
          required: [true, "TrackControl TrackID is required"],
          unique: true,
        },
        volume: { type: Number, required: [true, "User TrackControl Volume is required"] },
        pan: { type: Number, required: [true, "User TrackControl Pan is required"] },
        solo: { type: Boolean, required: [true, "User TrackControl Solo is required"] },
        mute: { type: Boolean, required: [true, "User TrackControl Mute is required"] },
      },
    ],
    default: [],
  },
});

// create model for ProjectUser using schema
const ProjectUser = mongoose.model("ProjectUser", projectUserSchema);

export default ProjectUser;
