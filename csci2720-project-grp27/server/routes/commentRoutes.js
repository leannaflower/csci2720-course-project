import { Router } from "express";
import * as commentController from "../controllers/commentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:venueId", authenticate, authorize("user", "admin"), commentController.listComments);
router.post("/:venueId", authenticate, authorize("user", "admin"), commentController.createComment);
router.delete("/:commentId", authenticate, authorize("admin"), commentController.deleteComment);

export default router;
