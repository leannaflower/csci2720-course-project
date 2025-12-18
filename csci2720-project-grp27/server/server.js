import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { requestLogger } from "./middleware/loggerMiddleware.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { seedDatasetIfNeeded } from "./utils/seedDataset.js";
import { seedUsersIfNeeded } from "./utils/seedUsers.js";

// Routes (all with .js extensions)
import userRoutes from "./routes/userRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect to MongoDB
await connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);

app.use("/api/users", userRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

app.use(errorHandler);

// Seed database
try {
  if (process.env.AUTO_SEED !== "false") {
    const didDataset = await seedDatasetIfNeeded(); // imports venues+events if no venues
    const didUsers = await seedUsersIfNeeded();     // creates admin+user if no admin

    console.log(`[seed] Startup seeding complete. dataset=${didDataset}, users=${didUsers}`);
  } else {
    console.log("[seed] AUTO_SEED=false. Skipping startup seeds.");
  }
} catch (e) {
  console.error("[seed] Startup seeding failed:", e);
}

app.listen(5001, () => {
  console.log(`Server running on port 5001`);
});