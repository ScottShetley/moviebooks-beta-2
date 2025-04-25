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
  // req.user is attached by 'protect' middleware and contains user ID from token
  if (!req.user || !req.user._id) {
     res.status(401); // Or 404, depending on desired behavior
     throw new Error('User not authenticated or user ID missing.');
  }

  // --- FIX: Explicitly fetch the user from the DB to get the latest data ---
  const user = await User.findById(req.user._id);
  // --- END FIX ---

  if (user) {
    // --- ADD THIS LOG ---
    console.log(`[getMyProfile] Fetched user ID ${user._id}. isPrivate is: ${user.isPrivate}`);
    // --- END LOG ---

    res.json({
      _id: user._id, // Use the freshly fetched user object
      username: user.username,
      email: user.email, // Okay to return email for user's own view
      displayName: user.displayName,
      bio: user.bio,
      location: user.location,
      profilePictureUrl: user.profilePictureUrl,
      favorites: user.favorites, // Include favorites for 'me' view
      isPrivate: user.isPrivate, // <-- Use isPrivate from the freshly fetched user
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } else {
    // Should not happen if protect middleware works, but good failsafe
    res.status(404);
    throw new Error('User profile data not found in database.');
  }
});

// @desc    Update current logged-in user's profile TEXT info (bio, location, displayName, isPrivate)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {

  // --- ADD THIS LOG AT THE START ---
  console.log('[updateUserProfile] Received request body:', req.body);
  // --- END LOG ---

  const user = await User.findById(req.user._id); // Get user document from DB

  if (user) {
    // Update allowed profile fields from req.body
    // Use ?? to allow setting fields to an empty string if desired
    // Add a check here too to see what values are being assigned
    user.displayName = req.body.displayName ?? user.displayName;
    console.log(`[updateUserProfile] Setting displayName to: ${user.displayName}`);

    user.bio = req.body.bio ?? user.bio;
    console.log(`[updateUserProfile] Setting bio to: ${user.bio}`);

    user.location = req.body.location ?? user.location;
     console.log(`[updateUserProfile] Setting location to: ${user.location}`);


    // IMPORTANT: profilePictureUrl is handled by the dedicated picture upload endpoint

    // --- Allow updating isPrivate field ---
    // Check if req.body.isPrivate is provided and is a boolean
    if (req.body.isPrivate !== undefined && typeof req.body.isPrivate === 'boolean') {
        user.isPrivate = req.body.isPrivate;
        console.log(`[updateUserProfile] Setting user.isPrivate to: ${user.isPrivate} based on req.body`);
    } else {
        // --- ADD LOGGING FOR WHY isPrivate ISN'T SET ---
        console.log(`[updateUserProfile] isPrivate not set: req.body.isPrivate is "${req.body.isPrivate}" (Type: ${typeof req.body.isPrivate})`);
        // --- END LOG ---
    }
    // --- END NEW ---

    // --- ADD LOGGING AROUND SAVE ---
    console.log(`[updateUserProfile] User document before save (isPrivate): ${user.isPrivate}`);
    let updatedUser;
    try {
        updatedUser = await user.save();
        console.log(`[updateUserProfile] User document AFTER successful save (isPrivate): ${updatedUser.isPrivate}`);
    } catch (saveError) {
        console.error("[updateUserProfile] Error during user.save():", saveError);
        // Check for Mongoose validation errors specifically
         if (saveError.name === 'ValidationError') {
             const messages = Object.values(saveError.errors).map(val => val.message);
             res.status(400).json({ message: messages.join(', ') });
         } else {
            res.status(500).json({ message: `Failed to save user profile: ${saveError.message}` });
         }
        return; // Stop execution after sending response
    }
    // --- END LOGGING ---


    // Return the updated user profile data (consistent with getMyProfile)
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      // email: updatedUser.email, // Don't necessarily need to return email on profile update
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      location: updatedUser.location,
      profilePictureUrl: updatedUser.profilePictureUrl, // Return existing pic URL
      favorites: updatedUser.favorites,
      isPrivate: updatedUser.isPrivate, // <-- NEW: Return updated privacy status
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
    // If profile picture is updated, maybe make profile public?
    // Or leave it to user's explicit privacy setting
    // user.isPrivate = false; // Optional: uncomment to make profile public on pic upload

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
      isPrivate: updatedUser.isPrivate, // <-- NEW: Include updated privacy status
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

  // Fetch the user profile first to check privacy status
  // Only select necessary fields for the check + public display
  const userProfile = await User.findById(userId).select(
    'username displayName bio location profilePictureUrl createdAt _id isPrivate' // Ensure isPrivate is selected
  ).lean(); // Use lean for performance as we are just checking and adding counts

  if (!userProfile) {
    res.status(404); // User not found
    throw new Error('User not found.');
  }

  // --- NEW PRIVACY CHECK ---
  // Check if the profile is private AND the requesting user is NOT the owner of the profile.
  // req.user is available if the user is logged in (due to 'protect' middleware likely running on other routes in the app,
  // although this specific route doesn't have 'protect', req.user *might* be populated
  // if the user was authenticated by a preceding middleware like in App.js or server.js,
  // but it's safer and more standard practice to ensure 'protect' middleware is used
  // *if* you rely on req.user being present for authentication checks.
  // However, for a *public* route, we shouldn't *require* auth, just check if they *are* the user if they *are* logged in.
  // Let's assume `req.user` exists only if they are logged in because of the global protect middleware
  // or AuthContext flow setting it up. Using req.user? is safer.
  const isViewingOwnProfile = req.user && userProfile._id && req.user._id.toString() === userProfile._id.toString();

  if (userProfile.isPrivate && !isViewingOwnProfile) {
    console.log(`[getPublicUserProfile] Access denied for private profile: ${userProfile.username} (ID: ${userId})`);
    // Return 404 to not reveal whether the user exists but is private
    res.status(404);
    throw new Error('User not found or profile is private.');
  }
  // --- END NEW PRIVACY CHECK ---


  // If not private OR viewing own profile, fetch counts concurrently
  // Note: Even for private profiles when viewed by the owner, we fetch counts.
  const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followee: userId }),
      Follow.countDocuments({ follower: userId })
  ]);

  // Combine the user profile data (which is a plain object due to .lean()) and the counts
  const profileDataWithCounts = {
      ...userProfile, // Spread all fields from the userProfile object (now including isPrivate)
      followerCount,    // Add the calculated follower count
      followingCount    // Add the calculated following count
  };

  console.log(`[getPublicUserProfile] Profile for ${userProfile.username} (ID: ${userId}) fetched successfully.`);

  res.json(profileDataWithCounts); // Send the combined data including counts and isPrivate
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

  // --- NEW PRIVACY CHECK (Similar to getPublicUserProfile) ---
  // We need to fetch the user document first to check the isPrivate flag
  const user = await User.findById(userId).select('_id isPrivate').lean();

   if (!user) {
      res.status(404); // User not found
      throw new Error('User not found.');
   }

   // Check if the requesting user is the owner
   const isViewingOwnConnections = req.user && user._id && req.user._id.toString() === user._id.toString();

   if (user.isPrivate && !isViewingOwnConnections) {
      console.log(`[getUserConnections] Access denied for connections of private profile: ${user._id}`);
      // Return 404 to not reveal whether the user exists but is private
      res.status(404);
      throw new Error('User not found or profile is private.');
   }
  // --- END NEW PRIVACY CHECK ---


  // If not private OR viewing own connections, fetch connections
  const connections = await Connection.find({ userRef: userId })
    // Populate userRef but only select specific fields for privacy reasons when not viewing own profile
    // We already did the privacy check above based on the *target* user's isPrivate status.
    // The fields populated here are for displaying the *author* info on the connection card/list item.
    // Even for a private profile (viewed by owner), or a public profile, we just need the author's basic public info.
    // Let's ensure we are not exposing sensitive fields like email here.
    .populate('userRef', 'username _id displayName profilePictureUrl') // Populate relevant user fields
    .populate('movieRef', 'title year director posterUrl _id')
    .populate('bookRef', 'title year author coverImageUrl _id')
    .sort({ createdAt: -1 });

  console.log(`[getUserConnections] Fetched ${connections.length} connections for user ID: ${userId}`);

  res.json(connections);
});


// @desc    Get a list of all public users
// @route   GET /api/users (This is a proposed route, already added to userRoutes)
// @access  Public
const getPublicUsersList = asyncHandler(async (req, res) => {
  console.log('[getPublicUsersList] Fetching public users...');
  // Find all users where isPrivate is false
  // Select only the fields needed for a user list item
  const publicUsers = await User.find({ isPrivate: false })
    .select('username displayName profilePictureUrl _id') // Select relevant public fields
    .sort({ username: 1 }) // Optional: Sort alphabetically by username
    .lean(); // Get plain JavaScript objects for performance

  console.log(`[getPublicUsersList] Found ${publicUsers.length} public users.`);

  res.json(publicUsers); // Send the list of public users
});


// --- Use NAMED exports ---
export {
  getMyProfile,
  updateUserProfile, // Handles text fields AND isPrivate now
  updateUserProfilePicture, // Handles picture upload
  getPublicUserProfile, // Updated with privacy check and includes follow counts
  getUserConnections, // Updated with privacy check
  getPublicUsersList, // Returns list of public users
};