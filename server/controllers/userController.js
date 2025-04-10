// server/controllers/userController.js (ES Modules - Includes Profile Picture Upload)
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js'; // Import Cloudinary config

// @desc    Get current logged-in user's detailed profile info
// @route   GET /api/users/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  // req.user is attached by 'protect' middleware and should be the full user document
  if (req.user) {
    // Return all relevant fields for the logged-in user's own view
    res.json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email, // Okay to return email for user's own view
      displayName: req.user.displayName,
      bio: req.user.bio,
      location: req.user.location,
      profilePictureUrl: req.user.profilePictureUrl,
      favorites: req.user.favorites, // Include favorites for 'me' view if needed later
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  } else {
    // Should be caught by protect middleware, but good failsafe
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update current logged-in user's profile TEXT info (bio, location, displayName)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id); // Get user document from DB

  if (user) {
    // Update only the allowed profile fields from req.body
    // Use ?? to allow setting fields to an empty string if desired
    user.displayName = req.body.displayName ?? user.displayName;
    user.bio = req.body.bio ?? user.bio;
    user.location = req.body.location ?? user.location;

    // IMPORTANT: profilePictureUrl is now handled by the dedicated picture upload endpoint
    // Do NOT update it here from req.body to avoid conflicts/overwrites
    // user.profilePictureUrl = req.body.profilePictureUrl ?? user.profilePictureUrl; // REMOVED THIS LINE

    const updatedUser = await user.save();

    // Return the updated user profile data (matching 'getMyProfile' structure, excluding email/password)
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      // email: updatedUser.email, // Don't necessarily need to return email on profile update
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      location: updatedUser.location,
      profilePictureUrl: updatedUser.profilePictureUrl, // Return existing pic URL
      favorites: updatedUser.favorites,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Upload/Update profile picture for logged-in user
// @route   PUT /api/users/profile/picture
// @access  Private
const updateUserProfilePicture = asyncHandler(async (req, res) => {
    // The 'uploadProfilePicture' middleware should have processed the file
    // and attached file details to req.file if successful.
    if (!req.file) {
        res.status(400);
        throw new Error('No image file uploaded.');
    }

    console.log('[updateUserProfilePicture] File uploaded via middleware:', req.file);

    const user = await User.findById(req.user._id);

    if (!user) {
        // Clean up the uploaded file if user not found (optional)
        try {
            console.log(`[updateUserProfilePicture] User not found, attempting to delete uploaded file: ${req.file.filename}`);
            await cloudinary.uploader.destroy(req.file.filename); // filename IS the public_id we set
        } catch (cleanupError) {
            console.error(`[updateUserProfilePicture] Failed to cleanup uploaded file after user not found error: ${cleanupError.message}`);
        }
        res.status(404);
        throw new Error('User not found');
    }

    const newProfilePictureUrl = req.file.path; // 'path' contains the secure_url from multer-storage-cloudinary

    // Optional: Delete old profile picture from Cloudinary before updating
    const oldProfilePictureUrl = user.profilePictureUrl;
    if (oldProfilePictureUrl && oldProfilePictureUrl !== newProfilePictureUrl) {
        try {
            // Extract public_id from the old URL.
            // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v12345/<folder>/<public_id>.<ext>
            // We need the folder/public_id part
            const urlParts = oldProfilePictureUrl.split('/');
            const publicIdWithFolderAndExt = urlParts.slice(urlParts.indexOf('upload') + 2).join('/');
            // Remove the extension (.jpg, .png etc)
            const publicIdWithFolder = publicIdWithFolderAndExt.substring(0, publicIdWithFolderAndExt.lastIndexOf('.'));

            if (publicIdWithFolder) {
                 console.log(`[updateUserProfilePicture] Attempting to delete old image from Cloudinary: ${publicIdWithFolder}`);
                 const result = await cloudinary.uploader.destroy(publicIdWithFolder);
                 console.log(`[updateUserProfilePicture] Old image deletion result:`, result); // result.result should be 'ok' or 'not found'
            }
        } catch (deleteError) {
            console.error(`[updateUserProfilePicture] Failed to delete old image from Cloudinary: ${deleteError.message}. Continuing update.`);
            // Don't block the update if deletion fails, just log it.
        }
    }

    // Update the user's profilePictureUrl with the new secure URL from Cloudinary
    user.profilePictureUrl = newProfilePictureUrl;

    const updatedUser = await user.save();

    // Return the updated user profile data (consistent with getMyProfile)
    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      location: updatedUser.location,
      profilePictureUrl: updatedUser.profilePictureUrl, // The newly updated URL
      favorites: updatedUser.favorites,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
});


// @desc    Get public profile info for a specific user by ID
// @route   GET /api/users/:userId/profile
// @access  Public
const getPublicUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid User ID format');
  }

  // Select only the fields safe for public display
  const userProfile = await User.findById(userId).select(
    'username displayName bio location profilePictureUrl createdAt _id'
  );

  if (!userProfile) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(userProfile); // Send the selected public profile fields
});

// @desc    Get all connections created by a specific user
// @route   GET /api/users/:userId/connections
// @access  Public
const getUserConnections = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid User ID format');
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
      res.status(404); throw new Error('User not found');
  }

  const connections = await Connection.find({ userRef: userId })
    .populate('userRef', 'username _id')
    .populate('movieRef', 'title year director posterUrl _id')
    .populate('bookRef', 'title year author coverImageUrl _id')
    .sort({ createdAt: -1 });

  res.json(connections);
});


// --- Use NAMED exports ---
export {
  getMyProfile,
  updateUserProfile, // Handles text fields ONLY now
  updateUserProfilePicture, // Handles picture upload
  getPublicUserProfile,
  getUserConnections,
};