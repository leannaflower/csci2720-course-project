import Venue from "../models/Venue.js";
import Event from "../models/Event.js";

export const listVenues = async (_req, res) => {
  try {
    // Return ALL venues, plus eventCount (0 if none)
    const venues = await Venue.aggregate([
      {
        $lookup: {
          from: "events",          // <- default Mongo collection name for Event model is usually "events"
          localField: "id",        // Venue.id
          foreignField: "venueid", // Event.venueid (matches your getVenueById query)
          as: "events",
        },
      },
      {
        $addFields: {
          eventCount: { $size: "$events" },
        },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
          latitude: 1,
          longitude: 1,
          eventCount: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    return res.json(venues);
  } catch (error) {
    console.error("listVenues error:", error);
    return res.status(500).json({ error: "Failed to load venues" });
  }
};

export const getVenueById = async (req, res) => {
  try {
    const { venueId } = req.params;

    const venue = await Venue.findOne({ id: venueId });
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const events = await Event.find({ venueid: venue.id }).sort({ date: 1 });
    return res.json({ venue, events });
  } catch (error) {
    console.error("getVenueById error:", error);
    return res.status(500).json({ error: "Failed to load venue" });
  }
};
