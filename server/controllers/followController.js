// server/controllers/followController.js
// Corrected import: Import asyncHandler from the installed package, not a local file
import asyncHandler from 'express-async-handler'; // <-- CORRECTED IMPORT
import Follow from '../models/Follow.js';
import User from '../models/User.js'; // Needed to check if user exists and potentially for populating followee details
import { generateNotification } from './notificationController.js'; // Assuming you have a notification controller

// @desc    Follow a user
// @route   POST /api/follows/:userId
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  const followeeId = req.params.userId; // The ID of the user being followed
  const followerId = req.user._id; // The ID of the currently logged-in user (from protect middleware)

  // Prevent a user from following themselves
  if (followerId.toString() === followeeId.toString()) {
    res.status(400);
    throw new Error('Cannot follow yourself');
  }

  // Check if the user to be followed exists
  const followeeExists = await User.findById(followeeId);
  if (!followeeExists) {
    res.status(404);
    throw new Error('User to follow not found');
  }

  // Check if the user is already following this user
  const existingFollow = await Follow.findOne({ follower: followerId, followee: followeeId });

  if (existingFollow) {
    res.status(400); // Bad Request
    throw new Error('Already following this user');
  }

  // Create the follow relationship
  const follow = new Follow({
    follower: followerId,
    followee: followeeId,
  });

  const createdFollow = await follow.save();

  // --- Generate Notification ---
  // Notify the followee that they have a new follower
  // Check if the recipient exists before creating notification
  if (followeeExists) {
      await generateNotification({
          recipient: followeeId, // The user who is being followed
          sender: followerId,   // The user who initiated the follow
          type: 'new_follower', // A new type for follow notifications
          message: `${req.user.username} started following you.`, // Custom message
          // Optional: Link to the sender's profile
          link: `/profile/${req.user.username}`,
      });
  }
  // --- End Notification Generation ---


  res.status(201).json(createdFollow);
});

// @desc    Unfollow a user
// @route   DELETE /api/follows/:userId
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  const followeeId = req.params.userId; // The ID of the user being unfollowed
  const followerId = req.user._id; // The ID of the currently logged-in user

  // Prevent trying to unfollow self (though unlikely to happen in UI)
  if (followerId.toString() === followeeId.toString()) {
     res.status(400);
     throw new Error('Cannot unfollow yourself');
  }

  // Find the follow relationship
  const follow = await Follow.findOneAndDelete({
    follower: followerId,
    followee: followeeId,
  });

  if (!follow) {
    res.status(404); // Not Found - no follow relationship existed
    throw new Error('Not following this user');
  }

  // You might choose to send a notification upon unfollow or not.
  // Typically, social apps don't notify for unfollows to avoid negativity.
  // We will skip notification generation here for unfollow.

  res.status(200).json({ message: 'Successfully unfollowed user' });
});

// @desc    Get users that a specific user is following
// @route   GET /api/follows/following/:userId
// @access  Public (can view anyone's following list)
const getFollowing = asyncHandler(async (req, res) => {
    const userId = req.params.userId; // The ID of the user whose 'following' list we want

    // Check if user exists whose following list is requested
    const userExists = await User.findById(userId);
    if (!userExists) {
        res.status(404);
        throw new Error('User not found');
    }

    const following = await Follow.find({ follower: userId })
        .populate('followee', 'username displayName profilePictureUrl') // Populate details of the user being followed
        .select('followee'); // Only select the followee field from the Follow model

    // The result will be an array of objects like { _id: ..., followee: { _id: ..., username: ..., ... } }.
    // We might want to return just the array of populated followee users.
    const followingUsers = following.map(item => item.followee);

    res.status(200).json(followingUsers);
});

// @desc    Get users that are following a specific user
// @route   GET /api/follows/followers/:userId
// @access  Public (can view anyone's followers list)
const getFollowers = asyncHandler(async (req, res) => {
    const userId = req.params.userId; // The ID of the user whose 'followers' list we want

    // Check if user exists whose followers list is requested
    const userExists = await User.findById(userId);
    if (!userExists) {
        res.status(404);
        throw new Error('User not found');
    }

    const followers = await Follow.find({ followee: userId })
        .populate('follower', 'username displayName profilePictureUrl') // Populate details of the user doing the following
        .select('follower'); // Only select the follower field from the Follow model

    // Return just the array of populated follower users.
    const followerUsers = followers.map(item => item.follower);

    res.status(200).json(followerUsers);
});

// @desc    Check if the currently logged-in user is following a specific user
// @route   GET /api/follows/is-following/:userId
// @access  Private
const isFollowing = asyncHandler(async (req, res) => {
    const followeeId = req.params.userId; // The ID of the user being checked if followed
    const followerId = req.user._id; // The ID of the currently logged-in user

    // Prevent checking against self
    if (followerId.toString() === followeeId.toString()) {
      res.status(200).json({ isFollowing: false, isSelf: true }); // Indicate it's self
      return;
    }

     // Check if the user to be checked exists
     const followeeExists = await User.findById(followeeId);
     if (!followeeExists) {
       res.status(404);
       throw new Error('User not found');
     }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      followee: followeeId,
    });

    // Return true if a follow relationship exists, false otherwise
    res.status(200).json({ isFollowing: !!existingFollow, isSelf: false }); // Include isSelf false
});


export {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  isFollowing
};