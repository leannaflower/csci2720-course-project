import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import Event from "./models/Event.js";
import Meta from "./models/Meta.js";
import Venue from "./models/Venue.js";

// ✅ Get __dirname in ES modules FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Always load server/.env (same as your backend server.js)
dotenv.config({ path: path.join(__dirname, ".env") });

// ✅ Use the same env var(s) as connectDB + correct fallback DB name
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/csci2720_project";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    console.log("Import DB name:", mongoose.connection.name);

    // ✅ preprocessing folder is at project root (one level above server/)
    const venuesPath = path.join(
      __dirname,
      "..",
      "preprocessing",
      "venues_clean.json"
    );
    const eventsPath = path.join(
      __dirname,
      "..",
      "preprocessing",
      "events_clean.json"
    );

    // ---- Import venues ----
    const venuesContent = fs.readFileSync(venuesPath, "utf8");
    const venues = JSON.parse(venuesContent);

    await Venue.deleteMany({});
    console.log("Cleared existing venues");

    const insertedVenues = await Venue.insertMany(venues);
    console.log(`Inserted ${insertedVenues.length} venues`);

    // ---- Import events ----
    const eventsContent = fs.readFileSync(eventsPath, "utf8");
    const events = JSON.parse(eventsContent);

    await Event.deleteMany({});
    console.log("Cleared existing events");

    const insertedEvents = await Event.insertMany(events);
    console.log(`Inserted ${insertedEvents.length} events`);

    // ---- Update lastUpdated meta ----
    const now = new Date();
    await Meta.findOneAndUpdate(
      { name: "dataset" },
      { lastUpdated: now },
      { upsert: true, new: true }
    );
    console.log(`lastUpdated = ${now.toISOString()}`);
  } catch (err) {
    console.error("Import failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

run();
