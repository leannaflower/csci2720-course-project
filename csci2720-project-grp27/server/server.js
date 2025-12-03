import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import venueRoutes from "./routes/venueRoutes.js";
// import userRoutes from "./routes/userRoutes.js";  // ⬅ comment this out

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/venues", venueRoutes);
// app.use("/api/users", userRoutes);  // ⬅ and this too

import { errorHandler } from "./middleware/errorMiddleware.js";
app.use(errorHandler);

import { requestLogger } from "./middleware/loggerMiddleware.js";
app.use(requestLogger);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});