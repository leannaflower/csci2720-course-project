import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import Event from "./models/Event.js";
import Meta from "./models/Meta.js";
import Venue from "./models/Venue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/csci2720_project";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function toVenueDocs(venuesClean) {
  return venuesClean.map(v => ({
    id: String(v.id),
    name: cleanText(v.name),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude)
  }));
}

function cleanText(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function toEventDocs(eventsClean) {
  return eventsClean.map(e => {
    const venueId = e.venue?.id ?? e.venueId;

    const datesArr = Array.isArray(e.dates) ? e.dates : [];
    const dateString = datesArr.join("; ");

    return {
      id: String(e.eventId ?? e.id),
      title: cleanText(e.title),
      venueid: String(venueId),
      date: dateString,
      description: cleanText(e.description),
      presenter: cleanText(e.presenter)
    };
  });
}


async function run() {
  try {
    assert(
      process.env.ALLOW_IMPORT === "true",
      "Refusing to import. Set ALLOW_IMPORT=true in server/.env to run this script."
    );

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    console.log("Import DB name:", mongoose.connection.name);

    const venuesPath = path.join(__dirname, "..", "preprocessing", "venues_clean.json");
    const eventsPath = path.join(__dirname, "..", "preprocessing", "events_clean.json");

    const venuesClean = readJson(venuesPath);
    const eventsClean = readJson(eventsPath);

    assert(Array.isArray(venuesClean), "venues_clean.json must be an array.");
    assert(Array.isArray(eventsClean), "events_clean.json must be an array.");
    assert(venuesClean.length === 10, `Expected 10 venues, got ${venuesClean.length}.`);

    const venueDocs = toVenueDocs(venuesClean);
    const venueIdSet = new Set(venueDocs.map(v => v.id));

    // Validate venues
    venueDocs.forEach(v => {
      assert(v.id, "Venue missing id.");
      assert(v.name, `Venue ${v.id} missing name.`);
      assert(Number.isFinite(v.latitude), `Venue ${v.id} latitude invalid.`);
      assert(Number.isFinite(v.longitude), `Venue ${v.id} longitude invalid.`);
    });

    const eventDocs = toEventDocs(eventsClean);

    // Validate events against your Event schema expectations
    eventDocs.forEach(e => {
      assert(e.id, "Event missing id.");
      assert(e.title, `Event ${e.id} missing title.`);
      assert(e.venueid, `Event ${e.id} missing venueid.`);
      assert(venueIdSet.has(e.venueid), `Event ${e.id} venueid not in selected 10 venues.`);
      assert(e.date && e.date.trim().length > 0, `Event ${e.id} missing date string.`);
    });

    // Validate >= 3 events per venue (counts events, not dates)
    const counts = {};
    eventDocs.forEach(e => {
      counts[e.venueid] = (counts[e.venueid] || 0) + 1;
    });
    venueDocs.forEach(v => {
      const c = counts[v.id] || 0;
      assert(c >= 3, `Venue ${v.id} has only ${c} events (< 3).`);
    });

    console.log("Validation passed.");
    venueDocs.forEach(v => console.log(`${v.name}: ${counts[v.id] || 0}`));

    await Venue.deleteMany({});
    const insertedVenues = await Venue.insertMany(venueDocs, { ordered: false });
    console.log(`Inserted ${insertedVenues.length} venues`);

    await Event.deleteMany({});
    const insertedEvents = await Event.insertMany(eventDocs, { ordered: false });
    console.log(`Inserted ${insertedEvents.length} events`);

    const now = new Date();
    await Meta.findOneAndUpdate(
      { name: "dataset" },
      { lastUpdated: now },
      { upsert: true, new: true }
    );
    console.log(`lastUpdated = ${now.toISOString()}`);
  } catch (err) {
    console.error("Import failed:", err.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

run();
