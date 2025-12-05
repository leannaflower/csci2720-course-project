const Venue = require("../models/Venue");
const Event = require("../models/Event");

exports.listVenues = async (_req, res) => {
  const venues = await Venue.find().sort({ name: 1 });
  res.json(venues);
};

exports.getVenueById = async (req, res) => {
  const venue = await Venue.findOne({ venueId: req.params.venueId });
  if (!venue) return res.status(404).json({ error: "Venue not found" });
  const events = await Event.find({ venueId: venue.venueId }).sort({ date: 1 });
  res.json({ venue, events });
};
