import Venue from "../models/Venue.js";
import Event from "../models/Event.js";

export async function listVenues(_req, res) {
  const venues = await Venue.find().sort({ name: 1 });
  return res.json(venues);
}

export async function getVenue(req, res) {
  const venue = await Venue.findOne({ venueId: req.params.venueId });
  if (!venue) return res.status(404).json({ error: "Venue not found" });

  const events = await Event.find({ venueId: venue.venueId }).sort({ date: 1 });
  return res.json({ venue, events });
}
