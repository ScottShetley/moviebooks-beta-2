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
  // req.user is attached by 'protect' middleware and should contain authenticated user data.
  if (req.user) {
    // Return a comprehensive set of fields for the user's own profile view.
    res.json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email, // Include email for the 'me' endpoint.
      displayName: req.user.displayName,
      bio: req.user.bio,
      location: req.user.location,
      profilePictureUrl: req.user.profilePictureUrl,
      favorites: req.user.favorites, // Include favorites list.
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  } else {
    // This case should ideally be prevented by the 'protect' middleware.
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update current logged-in user's profile TEXT info (bio, location, displayName)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // Fetch the user document directly from the database using the ID from the authenticated user.
  const user = await User.findById(req.user._id);

  if (user) {
    // Update only the allowed text-based profile fields from the request body.
    // Use nullish coalescing (??) to allow setting fields to an empty string,
    // while falling back to the existing value if the field is null or undefined in the request.
    user.displayName = req.body.displayName ?? user.displayName;
    user.bio = req.body.bio ?? user.bio;
    user.location = req.body.location ?? user.location;

    // IMPORTANT: profilePictureUrl is handled by the dedicated picture upload endpoint below.
    // It should NOT be updated here to prevent conflicts or accidental overwrites.

    const updatedUser = await user.save();

    // Return the updated user profile data, mirroring the structure of 'getMyProfile'.
    // Exclude sensitive fields like password hash (which isn't selected anyway).
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      // email: updatedUser.email, // Optionally exclude email from the update response.
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      location: updatedUser.location,
      profilePictureUrl: updatedUser.profilePictureUrl, // Return the existing or newly saved picture URL.
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
    // Assumes file upload middleware (e.g., Multer with multer-storage-cloudinary)
    // has processed the upload and attached file details to req.file.
    // req.file.path should contain the secure URL from Cloudinary.
    // req.file.filename should contain the public_id assigned by Cloudinary storage.
    if (!req.file || !req.file.path || !req.file.filename) {
        res.status(400);
        throw new Error('Image file upload failed or file details missing.');
    }

    // --- Debug log removed ---
    // console.log('[updateUserProfilePicture] File uploaded via middleware:', req.file);

    const user = await User.findById(req.user._id);

    if (!user) {
        // If the user is somehow not found after the file has been uploaded,
        // attempt to clean up the orphaned file from Cloudinary.
        try {
            // --- Debug log removed ---
            // console.log(`[updateUserProfilePicture] User not found, attempting to delete uploaded file: ${req.file.filename}`);
            // 'filename' from multer-storage-cloudinary corresponds to the public_id.
            await cloudinary.uploader.destroy(req.file.filename);
        } catch (cleanupError) {
            // Log the cleanup failure, but proceed to throw the User Not Found error.
            console.error(`[updateUserProfilePicture] Failed to cleanup uploaded file (${req.file.filename}) after user not found error: ${cleanupError.message}`);
        }
        res.status(404);
        throw new Error('User not found');
    }

    const newProfilePictureUrl = req.file.path; // The secure URL provided by Cloudinary.
    const oldProfilePictureUrl = user.profilePictureUrl;

    // --- Delete Old Cloudinary Image (Optional but Recommended) ---
    // If an old profile picture URL exists and it's different from the new one, attempt to delete it.
    if (oldProfilePictureUrl && oldProfilePictureUrl !== newProfilePictureUrl) {
        try {
            // Extract the public_id (including folder path) from the old URL.
            // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v12345/<folder>/<public_id>.<ext>
            // We need the part after '/upload/' and before the final extension, typically '<folder>/<public_id>' or just '<public_id>'.
            const uploadMarker = '/upload/';
            const startIndex = oldProfilePictureUrl.indexOf(uploadMarker);

            if (startIndex !== -1) {
                // Get the part of the URL after '/upload/'
                const pathWithVersion = oldProfilePictureUrl.substring(startIndex + uploadMarker.length);
                // Find the next '/' after the version number (if version exists)
                const firstSlashIndex = pathWithVersion.indexOf('/');
                // The public ID path starts after the version number (or at the beginning if no version in URL path)
                const publicIdWithPathAndExt = (firstSlashIndex !== -1) ? pathWithVersion.substring(firstSlashIndex + 1) : pathWithVersion;
                // Remove the file extension (.jpg, .png, etc.)
                const lastDotIndex = publicIdWithPathAndExt.lastIndexOf('.');
                const publicIdWithFolder = (lastDotIndex !== -1) ? publicIdWithPathAndExt.substring(0, lastDotIndex) : publicIdWithPathAndExt;

                if (publicIdWithFolder) {
                    // --- Debug logs removed ---
                    // console.log(`[updateUserProfilePicture] Attempting to delete old image from Cloudinary: ${publicIdWithFolder}`);
                    const result = await cloudinary.uploader.destroy(publicIdWithFolder);
                    // console.log(`[updateUserProfilePicture] Old image deletion result:`, result);
                    if (result.result !== 'ok' && result.result !== 'not found') {
                       console.warn(`[updateUserProfilePicture] Cloudinary deletion of old image (${publicIdWithFolder}) returned: ${result.result}`);
                    }
                } else {
                    console.warn(`[updateUserProfilePicture] Could not extract valid public_id from old URL: ${oldProfilePictureUrl}`);
                }
            } else {
                 console.warn(`[updateUserProfilePicture] Old profile picture URL format unexpected, cannot extract public_id for deletion: ${oldProfilePictureUrl}`);
            }
        } catch (deleteError) {
            // Log the error but don't prevent the user's profile from being updated with the new image.
            console.error(`[updateUserProfilePicture] Failed to delete old image from Cloudinary: ${deleteError.message}. Continuing update.`);
        }
    }

    // --- Update User Document ---
    // Store the new secure URL provided by Cloudinary.
    user.profilePictureUrl = newProfilePictureUrl;
    // Optionally store the public_id as well, which can simplify future deletions:
    // user.profilePicturePublicId = req.file.filename;

    const updatedUser = await user.save();

    // --- Send Response ---
    // Return the updated user profile data, consistent with getMyProfile.
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
  // Validate the user ID format.
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid User ID format');
  }

  // Find the user by ID and select only the fields considered safe for public display.
  // Exclude sensitive information like email, password hash, full favorites list etc.
  const userProfile = await User.findById(userId).select(
    'username displayName bio location profilePictureUrl createdAt _id'
  );

  if (!userProfile) {
    res.status(404);
    throw new Error('User not found');
  }

  // Send the selected public profile fields.
  res.json(userProfile);
});

// @desc    Get all connections created by a specific user
// @route   GET /api/users/:userId/connections
// @access  Public
const getUserConnections = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  // Validate the user ID format.
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid User ID format');
  }

  // Check if the user actually exists before querying their connections.
  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
      res.status(404); throw new Error('User not found');
  }

  // Find all connections where userRef matches the target user ID.
  const connections = await Connection.find({ userRef: userId })
    // Populate the user reference (likely just need ID and username here, maybe profile pic).
    .populate('userRef', 'username profilePictureUrl _id') // Using profilePictureUrl for consistency
    // Populate movie reference with relevant details.
    // **VERIFY** these field names (posterPath, year, director) against the Movie model schema.
    .populate('movieRef', 'title year director posterPath _id')
    // Populate book reference with relevant details.
    // **VERIFY** these field names (coverPath, year, author) against the Book model schema.
    .populate('bookRef', 'title year author coverPath _id')
    // Sort connections, newest first.
    .sort({ createdAt: -1 });

  // Return the list of connections (will be an empty array if none found).
  res.json(connections);
});


// --- Use NAMED exports ---
export {
  getMyProfile,
  updateUserProfile, // Handles text fields ONLY
  updateUserProfilePicture, // Handles picture upload
  getPublicUserProfile,
  getUserConnections,
};
