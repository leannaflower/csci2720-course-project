import { z } from "zod";
import Event from "../models/Event.js";
import Venue from "../models/Venue.js";

// GET /api/events
export const listEvents = async (req, res) => {
  try {
    const schema = z.object({
      venueid: z.string().min(1).optional(),
	  presenter: z.string().min(1).optional(),
      q: z.string().min(1).optional(), // search in title
      limit: z.coerce.number().int().min(1).max(100).default(50),
      offset: z.coerce.number().int().min(0).default(0),
      sort: z.enum(["date", "title", "id", "presenter", "venue"]).default("date"),
      order: z.enum(["asc", "desc"]).default("asc"),
      dateFrom: z.string().min(1).optional(),
      dateTo: z.string().min(1).optional()
    });

    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { venueid, presenter, q, limit, offset, sort, order, dateFrom, dateTo } = parsed.data;

    const filter = {};
    if (venueid) filter.venueid = venueid;
	if (presenter) filter.presenter = { $regex: presenter, $options: "i" };
    if (q) filter.title = { $regex: q, $options: "i" };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const sortStage =
      sort === "title" ? { title: order === "desc" ? -1 : 1 } :
      sort === "id" ? { id: order === "desc" ? -1 : 1 } :
      sort === "presenter" ? { presenter: order === "desc" ? -1 : 1 } :
      sort === "venue" ? { venueName: order === "desc" ? -1 : 1 } :
      { date: order === "desc" ? -1 : 1 };

    const [items, total] = await Promise.all([
      Event.aggregate([
        { $match: filter },
        { $skip: offset },
        { $limit: limit },
        {
          $lookup: {
            from: "venues",
            localField: "venueid",
            foreignField: "id",
            as: "venueDoc"
          }
        },
        {
          $addFields: {
          venueName: { $ifNull: [{ $arrayElemAt: ["$venueDoc.name", 0] }, "" ] }
          }
        },
        { $sort: sortStage },
        { $project: { venueDoc: 0 } }
      ]),
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
    const event = await Event.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const venue = await Venue.findOne({ id: event.venueid });
    return res.json({ event, venue });
  } catch (error) {
    console.error("getEventById error:", error);
    return res.status(500).json({ error: "Failed to load event" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    return res.status(201).json(event);
  } catch (error) {
    console.error("createEvent error:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { id: req.params.eventId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json(event);
  } catch (error) {
    console.error("updateEvent error:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const result = await Event.deleteOne({ id: req.params.eventId });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("deleteEvent error:", error);
    return res.status(500).json({ error: "Failed to delete event" });
  }
};

// GET /api/events/random?venueid=abc
export const getRandomEvents = async (req, res) => {
  try {
    const venueid = typeof req.query.venueid === "string" && req.query.venueid.trim()
      ? req.query.venueid.trim()
      : undefined;

    const matchStage = venueid ? { venueid } : {};

    const items = await Event.aggregate([
      { $match: matchStage },
      { $sample: { size: 3 } },
      {
        $lookup: {
          from: "venues",
          localField: "venueid",
          foreignField: "id",
          as: "venueDoc"
        }
      },
      {
        $addFields: {
          venueName: { $ifNull: [{ $arrayElemAt: ["$venueDoc.name", 0] }, "" ] }
        }
      },
      { $project: { venueDoc: 0, _id: 0 } }
    ]);

    return res.json({ items });
  } catch (error) {
    console.error("getRandomEvents error:", error);
    return res.status(500).json({ error: "Failed to load random events" });
  }
};