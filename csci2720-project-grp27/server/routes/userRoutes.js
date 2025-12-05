const { Router } = require("express");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

const router = Router();

/**
 * Auth endpoints (no standalone authRoutes file)
 */
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/refresh", userController.refresh);

/**
 * Authenticated user profile
 */
router.get("/me", authenticate, authorize("user", "admin"), userController.me);

/**
 * Admin-only user management
 */
router.get("/", authenticate, authorize("admin"), userController.listUsers);
router.post("/", authenticate, authorize("admin"), userController.createUser);
router.patch("/:userId", authenticate, authorize("admin"), userController.updateUser);
router.delete("/:userId", authenticate, authorize("admin"), userController.deleteUser);

module.exports = router;
