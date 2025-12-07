import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const favoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    venueId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 'ObjectId', venueId: 1 }, { unique: true });

const Favorite = model('Favorite', favoriteSchema);
export default Favorite;
