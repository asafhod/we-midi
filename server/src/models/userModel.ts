import mongoose, { Document, Schema } from "mongoose";

// define User interface
export interface User extends Document {
  username: string;
  isAdmin: boolean;
}

// database schema for User
const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    isAdmin: { type: Boolean, default: false },
  },
  { _id: false }
);

// create model for User using schema
const UserModel = mongoose.model("User", userSchema);

export default UserModel;
