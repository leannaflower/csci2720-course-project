const { Router } = require("express");
const favoriteController = require("../controllers/favoriteController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.get("/", authenticate, authorize("user", "admin"), favoriteController.listFavorites);
router.post("/", authenticate, authorize("user", "admin"), favoriteController.addFavorite);
router.delete("/:favoriteId", authenticate, authorize("user", "admin"), favoriteController.removeFavorite);

module.exports = router;
