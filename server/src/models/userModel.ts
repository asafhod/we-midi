import mongoose, { Document, Schema } from "mongoose";

// define User interface
interface IUser extends Document {
  username: string;
  isAdmin: boolean;
}

// database schema for User
const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  isAdmin: { type: Boolean, default: false },
});

// create model for User using schema
const User = mongoose.model("User", userSchema);

export default User;
