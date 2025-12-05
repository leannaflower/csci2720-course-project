import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "user" | "admin";
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export default model<IUser>("User", UserSchema);
