const { Router } = require("express");
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/refresh", userController.refresh);

router.get("/me", authenticate, authorize("user", "admin"), userController.me);

router.get("/", authenticate, authorize("admin"), userController.listUsers);
router.post("/", authenticate, authorize("admin"), userController.createUser);
router.patch("/:userId", authenticate, authorize("admin"), userController.updateUser);
router.delete("/:userId", authenticate, authorize("admin"), userController.deleteUser);

module.exports = router;
