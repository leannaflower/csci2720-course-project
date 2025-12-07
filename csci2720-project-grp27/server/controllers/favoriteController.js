import { z } from "zod";
import Favorite from "../models/Favorite.js";
import Venue from "../models/Venue.js";

const favoriteSchema = z.object({
  venueId: z.string().min(1, "venueId is required")
});

export const listFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(favorites);
  } catch (error) {
    console.error("listFavorites error:", error);
    return res.status(500).json({ error: "Failed to load favorites" });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const parsed = favoriteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { venueId } = parsed.data;

    const venueExists = await Venue.exists({ id: venueId });
    if (!venueExists) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const existing = await Favorite.findOne({ userId: req.user.id, venueId });
    if (existing) {
      return res.status(409).json({ error: "Venue already in favorites" });
    }

    const favorite = await Favorite.create({ userId: req.user.id, venueId });
    return res.status(201).json(favorite);
  } catch (error) {
    console.error("addFavorite error:", error);
    return res.status(500).json({ error: "Failed to add favorite" });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;

    const filter =
      req.user.role === "admin"
        ? { _id: favoriteId }
        : { _id: favoriteId, userId: req.user.id };

    const deleted = await Favorite.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("removeFavorite error:", error);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
};
