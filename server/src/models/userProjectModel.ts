import mongoose, { Document, Schema, Types } from "mongoose";

// define UserProject interface
interface IUserProject extends Document {
  _id: Types.ObjectId;
  userID: string;
  projectID: Types.ObjectId;
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
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, "_id is required"],
    unique: true,
  },
  userID: {
    type: String,
    required: [true, "UserID is required"],
  },
  projectID: {
    type: Schema.Types.ObjectId,
    required: [true, "ProjectID is required"],
  },
  admin: { type: Boolean, default: false },
  trackControls: {
    type: [
      {
        trackID: {
          type: Number,
          required: [true, "TrackID is required"],
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
