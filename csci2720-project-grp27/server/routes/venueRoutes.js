import express from "express";
import { getVenues } from "../controllers/venueController.js";

// // start of a quick placeholder
// import userRoutes from "./routes/userRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import eventRoutes from "./routes/eventRoutes.js";
// import favouriteRoutes from "./routes/favouriteRoutes.js";
// import commentRoutes from "./routes/commentRoutes.js";

// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/events", eventRoutes);
// app.use("/api/favourites", favouriteRoutes);
// app.use("/api/comments", commentRoutes);
// // end of a quick placeholder

const router = express.Router();

router.get("/", getVenues); // GET all venues

export default router;