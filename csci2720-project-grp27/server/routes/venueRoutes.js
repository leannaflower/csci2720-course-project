const { Router } = require("express");
const venueController = require("../controllers/venueController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.get("/", authenticate, authorize("user", "admin"), venueController.listVenues);
router.get("/:venueId", authenticate, authorize("user", "admin"), venueController.getVenueById);

module.exports = router;
