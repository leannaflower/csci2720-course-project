import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Event from "../models/Event.js";
import Meta from "../models/Meta.js";
import Venue from "../models/Venue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function toVenueDocs(venuesClean) {
  return venuesClean.map(v => ({
    id: String(v.id),
    name: cleanText(v.name),
    latitude: Number(v.latitude),
    longitude: Number(v.longitude)
  }));
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

export async function seedDatasetIfNeeded() {
  const venuesCount = await Venue.estimatedDocumentCount();
  if (venuesCount > 0) {
    console.log(`[seed] Venues exist (${venuesCount}). Skipping dataset import.`);
    return false;
  }

  console.log("[seed] No venues found. Importing dataset…");

  const venuesPath = path.join(__dirname, "..", "..", "preprocessing", "venues_clean.json");
  const eventsPath = path.join(__dirname, "..", "..", "preprocessing", "events_clean.json");

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

  eventDocs.forEach(e => {
    assert(e.id, "Event missing id.");
    assert(e.title, `Event ${e.id} missing title.`);
    assert(e.venueid, `Event ${e.id} missing venueid.`);
    assert(venueIdSet.has(e.venueid), `Event ${e.id} venueid not in selected 10 venues.`);
    assert(e.date && e.date.trim().length > 0, `Event ${e.id} missing date string.`);
  });

  const counts = {};
  eventDocs.forEach(e => {
    counts[e.venueid] = (counts[e.venueid] || 0) + 1;
  });
  venueDocs.forEach(v => {
    const c = counts[v.id] || 0;
    assert(c >= 3, `Venue ${v.id} has only ${c} events (< 3).`);
  });

  console.log("[seed] Validation passed.");
  venueDocs.forEach(v => console.log(`${v.name}: ${counts[v.id] || 0}`));

  await Venue.deleteMany({});
  const insertedVenues = await Venue.insertMany(venueDocs, { ordered: false });
  console.log(`[seed] Inserted ${insertedVenues.length} venues`);

  await Event.deleteMany({});
  const insertedEvents = await Event.insertMany(eventDocs, { ordered: false });
  console.log(`[seed] Inserted ${insertedEvents.length} events`);

  const now = new Date();
  await Meta.findOneAndUpdate(
    { name: "dataset" },
    { lastUpdated: now },
    { upsert: true, new: true }
  );
  console.log(`[seed] lastUpdated = ${now.toISOString()}`);

  return true;
}