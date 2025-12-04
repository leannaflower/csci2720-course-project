import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true, // event id from dataset
  },
  title: {
    type: String,
    required: true,
  },
  venueid: {
    type: String,
    required: true, // matches "venueid" in events.json
  },
  date: {
    type: String,
    required: true, // e.g. "1-30/11/2025"
  },
  description: {
    type: String,
    default: '',
  },
  presenter: {
    type: String,
    default: '',
  },
});

const Event = mongoose.model('Event', eventSchema);
export default Event;