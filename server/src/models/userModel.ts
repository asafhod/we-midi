import mongoose, { Document, Schema } from "mongoose";

// TODO: Use the AWS users feature and adapt this to work with that. Also make sure you're using IDs properly. What is ObjectId() that GPT used?

// define User interface
interface IUser extends Document {
  id: string; // TODO: Change to _id and ObjectId("[the-id]")?
  username: string;
  password: string;
  admin: boolean;
}

// database schema for User
const userSchema = new Schema<IUser>({
  id: {
    type: String,
    required: [true, "Required field"],
    unique: true,
  },
  username: { type: String, required: true, unique: true, minLength: 5, maxlength: 25 },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false },
});

// create model for User using schema
const User = mongoose.model("User", userSchema);

export default User;
