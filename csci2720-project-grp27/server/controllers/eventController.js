import { z } from "zod";
import Event from "../models/Event.js";
import Venue from "../models/Venue.js";

// GET /api/events
export const listEvents = async (req, res) => {
  try {
    const schema = z.object({
      venueId: z.string().min(1).optional(),
      q: z.string().min(1).optional(), // search in title
      limit: z.coerce.number().int().min(1).max(100).default(50),
      offset: z.coerce.number().int().min(0).default(0),
      sort: z.enum(["date", "title", "eventId"]).default("date"),
      order: z.enum(["asc", "desc"]).default("asc"),
      dateFrom: z.string().min(1).optional(),
      dateTo: z.string().min(1).optional()
    });

    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { venueId, q, limit, offset, sort, order, dateFrom, dateTo } = parsed.data;

    const filter = {};
    if (venueId) filter.venueId = venueId;
    if (q) filter.title = { $regex: q, $options: "i" };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const sortStage =
      sort === "title"
        ? { title: order === "desc" ? -1 : 1 }
        : sort === "eventId"
        ? { eventId: order === "desc" ? -1 : 1 }
        : { date: order === "desc" ? -1 : 1 };

    const [items, total] = await Promise.all([
      Event.find(filter).sort(sortStage).skip(offset).limit(limit),
      Event.countDocuments(filter)
    ]);

    return res.json({ items, total, limit, offset });
  } catch (error) {
    console.error("listEvents error:", error);
    return res.status(500).json({ error: "Failed to load events" });
  }
};

// GET /api/events/:eventId
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const venue = await Venue.findOne({ venueId: event.venueId });
    return res.json({ event, venue });
  } catch (error) {
    console.error("getEventById error:", error);
    return res.status(500).json({ error: "Failed to load event" });
  }
};
