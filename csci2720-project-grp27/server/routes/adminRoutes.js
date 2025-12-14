import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import * as eventController from "../controllers/eventController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/dashboard", adminController.getDashboard);

router.post("/venues", adminController.createVenue);
router.patch("/venues/:venueId", adminController.updateVenue);
router.delete("/venues/:venueId", adminController.deleteVenue);

router.post("/events", eventController.createEvent);
router.patch("/events/:eventId", eventController.updateEvent);
router.delete("/events/:eventId", eventController.deleteEvent);

export default router;
