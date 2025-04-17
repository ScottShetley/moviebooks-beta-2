// server/middleware/uploadMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import path from 'path';

// --- Debug log removed ---
// console.log('[uploadMiddleware] Middleware file loaded and configuring (ESM)...');

// --- Cloudinary Storage Configuration (Reusable) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Use the pre-configured Cloudinary instance
  params: (req, file) => {
    // Determine the Cloudinary folder for the upload.
    // Use environment variable or a default development folder.
    let folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'moviebooks_dev';

    // Optional: Organize profile pictures into a subfolder.
    if (file.fieldname === 'profilePicture') {
        folder = `${folder}/profile_pictures`;
    }

    // --- Generate a unique and descriptive filename for Cloudinary ---
    const uniqueSuffix = Date.now();
    // Extract the original filename without the extension using Node's path module.
    const originalNameWithoutExt = path.parse(file.originalname).name;
    // Sanitize the original name: replace non-alphanumeric characters with underscores.
    const sanitizedOriginalName = originalNameWithoutExt.replace(/[^a-zA-Z0-9_]/g, '_');
    // Include user ID in the filename if available (requires auth middleware to run first).
    // Fallback to 'unknown_user' if req.user is not populated.
    const userId = req.user?._id || 'unknown_user';
    // Construct the final public_id (filename) for Cloudinary.
    const filename = `${file.fieldname}-${userId}-${uniqueSuffix}-${sanitizedOriginalName}`;

    // --- Debug log removed ---
    // console.log(`[Cloudinary Storage] Uploading ${file.originalname} as ${folder}/${filename} for field ${file.fieldname}`);

    // Return the parameters for Cloudinary upload.
    return {
      folder: folder, // The target folder in Cloudinary.
      public_id: filename, // The unique filename (public_id) in Cloudinary.
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // Allowed image formats.
      // Optional: Add transformations (e.g., for profile pictures). Applied *after* upload.
      // transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }]
    };
  },
});


// --- File Filter Function (Reusable) ---
/**
 * Checks if the uploaded file is an allowed image type (jpeg, jpg, png, gif).
 * Used by Multer's fileFilter option.
 * @param {object} file - The file object provided by Multer.
 * @param {function} cb - The callback function (cb(error, acceptFileBoolean)).
 */
function checkFileType(file, cb) {
  // Define allowed file extensions and MIME types using regex.
  const filetypes = /jpeg|jpg|png|gif/;
  // Test the file extension.
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  // Test the MIME type.
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    // --- Debug log removed ---
    // console.log(`[File Filter] Accepting file: ${file.originalname} (Type: ${file.mimetype}) for field ${file.fieldname}`);
    // File type is allowed, accept the file.
    return cb(null, true);
  } else {
    // --- Debug log removed ---
    // console.log(`[File Filter] Rejecting file: ${file.originalname} (Type: ${file.mimetype}) for field ${file.fieldname}`);
    // File type is not allowed, reject the file with an error.
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'), false);
  }
}

// --- Initialize Multer (Common Config) ---
// Base configuration object for Multer, shared by different upload scenarios.
const baseMulterConfig = {
  storage: storage, // Use the configured Cloudinary storage engine.
  limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5MB.
  fileFilter: function (req, file, cb) {
    // --- Debug log removed ---
    // console.log(`[multer fileFilter] Checking file: ${file.originalname} for field ${file.fieldname}`);
    // Use the checkFileType function to validate the uploaded file.
    checkFileType(file, cb);
  },
};

// --- Middleware for Connection Images (Multiple Fields) ---
// Creates a Multer instance configured to handle multiple file fields
// expected when creating/updating a connection. Populates `req.files`.
const uploadConnectionImages = multer(baseMulterConfig).fields([
  { name: 'moviePoster', maxCount: 1 }, // Expect up to 1 file for 'moviePoster' field.
  { name: 'bookCover', maxCount: 1 },   // Expect up to 1 file for 'bookCover' field.
  { name: 'screenshot', maxCount: 1 },  // Expect up to 1 file for 'screenshot' field.
]);

// --- Middleware for Single Profile Picture Upload ---
// Creates a Multer instance configured to handle a single file upload
// expected on the 'profilePicture' field. Populates `req.file`.
const uploadProfilePicture = multer(baseMulterConfig).single('profilePicture');


// --- Export BOTH middleware instances (named exports) ---
// Export the configured Multer middleware instances for use in route definitions.
export { uploadConnectionImages, uploadProfilePicture };

// Note: This file uses named exports. Ensure imports in route files are updated accordingly.
// Example: import { uploadConnectionImages } from '../middleware/uploadMiddleware.js';
// Example: import { uploadProfilePicture } from '../middleware/uploadMiddleware.js';
