import mongoose from 'mongoose';

const metaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // e.g. "dataset"
  },
  lastUpdated: {
    type: Date,
    required: true,
  },
});

const Meta = mongoose.model('Meta', metaSchema);
export default Meta;