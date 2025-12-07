import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    venueId: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

const Comment = model('Comment', commentSchema);
export default Comment;
