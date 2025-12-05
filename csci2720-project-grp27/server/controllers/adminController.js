const Venue = require("../models/Venue");
const Event = require("../models/Event");

exports.getDashboard = async (_req, res) => {
  const venueCount = await Venue.countDocuments();
  const eventCount = await Event.countDocuments();
  res.json({ venueCount, eventCount });
};

exports.createVenue = async (req, res) => {
  const venue = await Venue.create(req.body);
  res.status(201).json(venue);
};

exports.updateVenue = async (req, res) => {
  const venue = await Venue.findOneAndUpdate({ venueId: req.params.venueId }, req.body, { new: true });
  if (!venue) return res.status(404).json({ error: "Venue not found" });
  res.json(venue);
};

exports.deleteVenue = async (req, res) => {
  await Venue.deleteOne({ venueId: req.params.venueId });
  res.status(204).send();
};
