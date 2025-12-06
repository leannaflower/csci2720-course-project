import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", authenticate, authorize("admin"), adminController.getDashboard);
router.post("/venues", authenticate, authorize("admin"), adminController.createVenue);
router.patch("/venues/:venueId", authenticate, authorize("admin"), adminController.updateVenue);
router.delete("/venues/:venueId", authenticate, authorize("admin"), adminController.deleteVenue);

export default router;
