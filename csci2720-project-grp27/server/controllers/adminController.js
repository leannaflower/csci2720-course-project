import Venue from "../models/Venue.js";
import Event from "../models/Event.js";

export async function createVenue(req, res) {
  const venue = await Venue.create(req.body);
  return res.status(201).json(venue);
}

export async function deleteEvent(req, res) {
  await Event.deleteOne({ eventId: req.params.eventId });
  return res.status(204).send();
}
