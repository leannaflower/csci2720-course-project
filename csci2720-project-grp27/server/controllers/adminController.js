import Venue from "../models/Venue.js";
import Event from "../models/Event.js";

export const getDashboard = async (_req, res) => {
  try {
    const [venueCount, eventCount] = await Promise.all([
      Venue.countDocuments(),
      Event.countDocuments()
    ]);
    return res.json({ venueCount, eventCount });
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
};

export const createVenue = async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    return res.status(201).json(venue);
  } catch (error) {
    console.error("createVenue error:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const updateVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const venue = await Venue.findOneAndUpdate(
      { id: venueId },
      req.body,
      { new: true, runValidators: true }
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

export const deleteVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const result = await Venue.deleteOne({ id: venueId });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Venue not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("deleteVenue error:", error);
    return res.status(500).json({ error: "Failed to delete venue" });
  }
};
