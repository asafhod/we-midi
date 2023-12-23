import mongoose, { Document, Schema } from "mongoose";

// define User interface
interface IUser extends Document {
  _id: string;
  admin: boolean;
}

// database schema for User
const userSchema = new Schema<IUser>({
  _id: {
    type: String,
    required: [true, "_id is required"],
    unique: true,
  },
  admin: { type: Boolean, default: false },
});

// create model for User using schema
const User = mongoose.model("User", userSchema);

export default User;
