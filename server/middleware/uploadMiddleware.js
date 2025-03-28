// server/middleware/uploadMiddleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Import configured instance
const path = require('path');
// const fs = require('fs'); // No longer needed

// --- Removed local directory creation logic ---

// --- Cloudinary Storage Configuration ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Determine folder based on environment variable or default
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'moviebooks_dev';
    // Generate a unique public ID (filename in Cloudinary)
    // Example: moviebooks_dev/moviePoster-1678886400000-originalnameWithoutExt
    const uniqueSuffix = Date.now();
    const originalNameWithoutExt = path.parse(file.originalname).name;
    // Sanitize original name slightly (replace spaces, etc.) - optional but good practice
    const sanitizedOriginalName = originalNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`;

    console.log(`[Cloudinary Storage] Uploading ${file.originalname} as ${folder}/${filename}`);

    return {
      folder: folder,
      public_id: filename, // Use generated filename as public_id
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // Specify allowed formats directly here
      // Optional: Add transformations during upload
      // transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    };
  },
});


// --- File Filter Function (Kept your existing logic) ---
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  // Check mimetype
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log(`[File Filter] Accepting file: ${file.originalname} (Type: ${file.mimetype})`);
    return cb(null, true); // Accept file
  } else {
    console.log(`[File Filter] Rejecting file: ${file.originalname} (Type: ${file.mimetype})`);
    // Reject file with a specific error message
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'), false); // Pass false to reject
  }
}

// --- Initialize Multer with Cloudinary Storage ---
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file (kept your limit)
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// --- Middleware Instance for Specific Fields ---
// This directly uses the upload instance configured above
const uploadConnectionImages = upload.fields([
  { name: 'moviePoster', maxCount: 1 },
  { name: 'bookCover', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
]);

// --- Removed the handleUpload wrapper function ---
// Error handling will now primarily be managed by your global error handler
// or specific checks within the controller if needed. Multer errors call next(err).

// --- Export the configured middleware instance directly ---
module.exports = uploadConnectionImages;