import Venue from "../models/Venue.js";
import Event from "../models/Event.js";

export const listVenues = async (_req, res) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    return res.json(venues);
  } catch (error) {
    console.error("listVenues error:", error);
    return res.status(500).json({ error: "Failed to load venues" });
  }
};

export const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findOne({ id: req.params.venueId });
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    const events = await Event.find({ venueid: venue.id }).sort({ date: 1 });
    return res.json({ venue, events });
  } catch (error) {
    console.error("getVenueById error:", error);
    return res.status(500).json({ error: "Failed to load venue" });
  }
};
