const { Router } = require("express");
const eventController = require("../controllers/eventController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.get("/", authenticate, authorize("user", "admin"), eventController.listEvents);
router.get("/:eventId", authenticate, authorize("user", "admin"), eventController.getEventById);

module.exports = router;
