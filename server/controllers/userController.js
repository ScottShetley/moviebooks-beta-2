// server/controllers/userController.js (ES Modules - Includes Profile Picture Upload)
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Follow from '../models/Follow.js'; // <-- NEW: Import Follow model
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js'; // Import Cloudinary config

// @desc    Get current logged-in user's detailed profile info
// @route   GET /api/users/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  // req.user is attached by 'protect' middleware and should be the full user document
  if (req.user) {
    // Note: Follower/Following counts are typically fetched separately or added to this endpoint if needed.
    // For now, we're adding them to the public profile endpoint as per the plan.
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
            // filename IS the public_id we set in the Cloudinary storage options
            await cloudinary.uploader.destroy(req.file.filename);
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
            // The public_id is usually the part after the version number and before the extension
            // e.g. .../upload/v1234567890/users/profile_pics/abcdef12345.jpg -> users/profile_pics/abcdef12345
            const urlParts = oldProfilePictureUrl.split('/');
            // Find the 'upload' segment and take parts after + 2 (version and public_id)
             const uploadIndex = urlParts.indexOf('upload');
             if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
                const publicIdWithFolderAndExt = urlParts.slice(uploadIndex + 2).join('/');
                // Remove the extension (.jpg, .png etc)
                const publicIdWithFolder = publicIdWithFolderAndExt.substring(0, publicIdWithFolderAndExt.lastIndexOf('.'));

                if (publicIdWithFolder) {
                     console.log(`[updateUserProfilePicture] Attempting to delete old image from Cloudinary: ${publicIdWithFolder}`);
                     const result = await cloudinary.uploader.destroy(publicIdWithFolder);
                     console.log(`[updateUserProfilePicture] Old image deletion result:`, result); // result.result should be 'ok' or 'not found'
                } else {
                     console.warn(`[updateUserProfilePicture] Could not extract public_id from old URL: ${oldProfilePictureUrl}`);
                }
             } else {
                  console.warn(`[updateUserProfilePicture] Unexpected old image URL format: ${oldProfilePictureUrl}`);
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


// @desc    Get public profile info for a specific user by ID, including follow counts
// @route   GET /api/users/:userId/profile
// @access  Public
const getPublicUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid User ID format');
  }

  // Use Promise.all to fetch profile data and calculate counts concurrently
  const [userProfile, followerCount, followingCount] = await Promise.all([
      // Fetch user profile data, selecting only public fields and returning a lean object
      User.findById(userId).select(
        'username displayName bio location profilePictureUrl createdAt _id'
      ).lean(),

      // Count documents where the 'followee' is the target user (these are the user's followers)
      Follow.countDocuments({ followee: userId }),

      // Count documents where the 'follower' is the target user (these are the users this user is following)
      Follow.countDocuments({ follower: userId })
  ]);


  if (!userProfile) {
    res.status(404);
    throw new Error('User not found');
  }

  // Combine the user profile data (which is a plain object due to .lean()) and the counts
  const profileDataWithCounts = {
      ...userProfile, // Spread all fields from the userProfile object
      followerCount,    // Add the calculated follower count
      followingCount    // Add the calculated following count
  };

  console.log(`[getPublicUserProfile] Profile for ${userProfile.username} (ID: ${userId}) fetched. Followers: ${followerCount}, Following: ${followingCount}`);


  res.json(profileDataWithCounts); // Send the combined data including counts
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
  getPublicUserProfile, // Now includes follow counts
  getUserConnections,
};