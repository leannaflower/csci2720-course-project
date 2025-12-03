// example model for Venue:
import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({
    id: String,
    name: String,
    latitude: Number,
    longitude: Number
});

export default mongoose.model("Venue", venueSchema);

// then in the Venue controller, we can do: const venues = await Venue.find();
