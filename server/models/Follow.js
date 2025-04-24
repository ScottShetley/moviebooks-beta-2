// server/models/Follow.js
import mongoose from 'mongoose';

const followSchema = mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Ensure that a user can't follow the same user multiple times
      // This check is also implemented in the controller, but schema-level is good practice
    },
    followee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Ensure that a user can't follow the same user multiple times
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields to track when the follow occurred
  }
);

// Add a unique compound index to ensure that a follower-followee pair is unique
// This prevents duplicate follow entries for the same relationship.
followSchema.index({ follower: 1, followee: 1 }, { unique: true });

const Follow = mongoose.model('Follow', followSchema);

export default Follow;