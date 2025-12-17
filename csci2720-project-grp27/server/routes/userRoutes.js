import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/refresh", userController.refresh);
router.post("/register", userController.register);

router.get("/me", authenticate, authorize("user", "admin"), userController.me);

router.get("/", authenticate, authorize("admin"), userController.listUsers);
router.post("/", authenticate, authorize("admin"), userController.createUser);
router.patch("/:userId", authenticate, authorize("admin"), userController.updateUser);
router.delete("/:userId", authenticate, authorize("admin"), userController.deleteUser);

export default router;
