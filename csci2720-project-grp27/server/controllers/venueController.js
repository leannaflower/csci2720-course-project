const Venue = require("../models/Venue");
const Event = require("../models/Event");

exports.listVenues = async (_req, res) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    return res.json(venues);
  } catch (error) {
    console.error("listVenues error:", error);
    return res.status(500).json({ error: "Failed to load venues" });
  }
};

exports.getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findOne({ venueId: req.params.venueId });
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    const events = await Event.find({ venueId: venue.venueId }).sort({ date: 1 });
    return res.json({ venue, events });
  } catch (error) {
    console.error("getVenueById error:", error);
    return res.status(500).json({ error: "Failed to load venue" });
  }
};
