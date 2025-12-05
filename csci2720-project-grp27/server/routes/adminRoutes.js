const { Router } = require("express");
const adminController = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.get("/dashboard", authenticate, authorize("admin"), adminController.getDashboard);
router.post("/venues", authenticate, authorize("admin"), adminController.createVenue);
router.patch("/venues/:venueId", authenticate, authorize("admin"), adminController.updateVenue);
router.delete("/venues/:venueId", authenticate, authorize("admin"), adminController.deleteVenue);

module.exports = router;
