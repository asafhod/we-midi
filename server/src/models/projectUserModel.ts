import mongoose, { Document, Schema, Types } from "mongoose";

// define ProjectUser interface
export interface ProjectUser extends Document {
  projectID: Types.ObjectId;
  username: string;
  isProjectAdmin: boolean;
  accepted: boolean;
  //  TODO: Implement these in localStorage
  // trackControls: {
  //   trackID: number;
  //   volume: number;
  //   pan: number;
  //   solo: boolean;
  //   mute: boolean;
  // }[];
}

// database schema for ProjectUser
const projectUserSchema = new Schema<ProjectUser>(
  {
    projectID: {
      type: Schema.Types.ObjectId,
      required: [true, "ProjectID is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    isProjectAdmin: { type: Boolean, default: false },
    accepted: { type: Boolean, default: false },
  },
  { _id: false }
);

// compound unique index for projectID and username
projectUserSchema.index({ projectID: 1, username: 1 }, { unique: true });

// create model for ProjectUser using schema
const ProjectUserModel = mongoose.model("ProjectUser", projectUserSchema);

export default ProjectUserModel;
