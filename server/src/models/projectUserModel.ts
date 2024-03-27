import mongoose, { Document, Schema, Types } from "mongoose";

// define ProjectUser interface
export interface ProjectUser extends Document {
  projectID: Types.ObjectId;
  username: string;
  isProjectAdmin: boolean;
  isAccepted: boolean;
  color: number;
  //  TODO: Implement these in localStorage
  // trackControls: {
  //   trackID: number;
  //   instrument: string;
  //   volume: number;
  //   pan: number;
  //   solo: boolean;
  //   mute: boolean;
  // }[];
}

// database schema for ProjectUser
const projectUserSchema = new Schema<ProjectUser>({
  projectID: {
    type: Schema.Types.ObjectId,
    required: [true, "ProjectID is required"],
  },
  username: {
    type: String,
    required: [true, "Username is required"],
  },
  isProjectAdmin: { type: Boolean, default: false },
  isAccepted: { type: Boolean, default: false },
  color: { type: Number, required: [true, "Color is required"] },
});

// compound unique index for projectID and username
projectUserSchema.index({ projectID: 1, username: 1 }, { unique: true });

// create model for ProjectUser using schema
const ProjectUserModel = mongoose.model("ProjectUser", projectUserSchema);

export default ProjectUserModel;
