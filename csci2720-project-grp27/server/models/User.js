import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    favourites: [{ type: Schema.Types.ObjectId, ref: "Venue" }],
  },
  { timestamps: true }
);

export default model("User", userSchema);
