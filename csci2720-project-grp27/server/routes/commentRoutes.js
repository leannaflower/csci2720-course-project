const { Router } = require("express");
const commentController = require("../controllers/commentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.get("/:venueId", authenticate, authorize("user", "admin"), commentController.listComments);
router.post("/:venueId", authenticate, authorize("user", "admin"), commentController.createComment);
router.delete("/:commentId", authenticate, authorize("admin"), commentController.deleteComment);

module.exports = router;
