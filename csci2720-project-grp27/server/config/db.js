import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/csci2720-project";

    // Helpful debug (shows which DB you are actually using)
    console.log("Mongo URI in use:", uri.replace(/\/\/.*?:.*?@/, "//***:***@"));

    const conn = await mongoose.connect(uri);

    console.log("Connected to MongoDB");
    console.log("MongoDB host:", conn.connection.host);
    console.log("MongoDB db name:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
