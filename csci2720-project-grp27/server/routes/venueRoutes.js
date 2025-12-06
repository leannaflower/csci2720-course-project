import { Router } from "express";
import * as venueController from "../controllers/venueController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, authorize("user", "admin"), venueController.listVenues);
router.get("/:venueId", authenticate, authorize("user", "admin"), venueController.getVenueById);

export default router;
