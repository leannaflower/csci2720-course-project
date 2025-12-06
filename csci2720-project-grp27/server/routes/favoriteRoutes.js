import { Router } from "express";
import * as favoriteController from "../controllers/favoriteController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, authorize("user", "admin"), favoriteController.listFavorites);
router.post("/", authenticate, authorize("user", "admin"), favoriteController.addFavorite);
router.delete("/:favoriteId", authenticate, authorize("user", "admin"), favoriteController.removeFavorite);

export default router;
