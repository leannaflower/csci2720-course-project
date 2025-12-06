const Venue = require("../models/Venue");
const Event = require("../models/Event");

exports.getDashboard = async (_req, res) => {
  try {
    const [venueCount, eventCount] = await Promise.all([
      Venue.countDocuments(),
      Event.countDocuments(),
    ]);
    return res.json({ venueCount, eventCount });
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
};

exports.createVenue = async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    return res.status(201).json(venue);
  } catch (error) {
    console.error("createVenue error:", error);
    return res.status(400).json({ error: error.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findOneAndUpdate(
      { venueId: req.params.venueId },
      req.body,
      { new: true }
    );
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    return res.json(venue);
  } catch (error) {
    console.error("updateVenue error:", error);
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    await Venue.deleteOne({ venueId: req.params.venueId });
    return res.status(204).send();
  } catch (error) {
    console.error("deleteVenue error:", error);
    return res.status(500).json({ error: "Failed to delete venue" });
  }
};
