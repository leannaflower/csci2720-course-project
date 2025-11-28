import express from "express";
import { getVenues } from "../controllers/venueController.js";

const router = express.Router();

router.get("/", getVenues); // GET all venues

export default router;