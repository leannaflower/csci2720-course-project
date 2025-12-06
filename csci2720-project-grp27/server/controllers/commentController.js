import { z } from "zod";
import Comment from "../models/Comment.js";
import Venue from "../models/Venue.js";

const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long")
});

export const listComments = async (req, res) => {
  try {
    const { venueId } = req.params;
    const comments = await Comment.find({ venueId }).sort({ createdAt: -1 });
    return res.json(comments);
  } catch (error) {
    console.error("listComments error:", error);
    return res.status(500).json({ error: "Failed to load comments" });
  }
};

export const createComment = async (req, res) => {
  try {
    const { venueId } = req.params;
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const venueExists = await Venue.exists({ venueId });
    if (!venueExists) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const comment = await Comment.create({
      venueId,
      userId: req.user.id,
      username: req.user.username,
      text: parsed.data.text
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error("createComment error:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const deleted = await Comment.findByIdAndDelete(commentId);
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("deleteComment error:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
};
