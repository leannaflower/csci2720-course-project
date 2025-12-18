import { Router } from "express";
import * as eventController from "../controllers/eventController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, authorize("user", "admin"), eventController.listEvents);
router.get("/random", authenticate, authorize("user", "admin"), eventController.getRandomEvents);
router.get("/:eventId", authenticate, authorize("user", "admin"), eventController.getEventById);

export default router;
