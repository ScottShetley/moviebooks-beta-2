// server/middleware/uploadMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import path from 'path';

console.log('[uploadMiddleware] Middleware file loaded and configuring (ESM)...');

// --- Cloudinary Storage Configuration (Reusable) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Determine folder based on fieldname or keep consistent
    let folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'moviebooks_dev';
    if (file.fieldname === 'profilePicture') {
        // Optional: Use a different folder for profile pics
        folder = `${folder}/profile_pictures`;
    }

    const uniqueSuffix = Date.now();
    const originalNameWithoutExt = path.parse(file.originalname).name;
    const sanitizedOriginalName = originalNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    // Include username or user ID in filename for better organization (if available on req.user)
    const userId = req.user?._id || 'unknown_user';
    const filename = `${file.fieldname}-${userId}-${uniqueSuffix}-${sanitizedOriginalName}`;

    console.log(`[Cloudinary Storage] Uploading ${file.originalname} as ${folder}/${filename} for field ${file.fieldname}`);

    return {
      folder: folder,
      public_id: filename,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      // Optional: Add transformations for profile pictures (e.g., square crop, resize)
      // transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }]
    };
  },
});


// --- File Filter Function (Reusable) ---
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log(`[File Filter] Accepting file: ${file.originalname} (Type: ${file.mimetype}) for field ${file.fieldname}`);
    return cb(null, true);
  } else {
    console.log(`[File Filter] Rejecting file: ${file.originalname} (Type: ${file.mimetype}) for field ${file.fieldname}`);
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'), false);
  }
}

// --- Initialize Multer (Common Config) ---
const baseMulterConfig = {
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    console.log(`[multer fileFilter] Checking file: ${file.originalname} for field ${file.fieldname}`);
    checkFileType(file, cb);
  },
};

// --- Middleware for Connection Images (Multiple Fields) ---
const uploadConnectionImages = multer(baseMulterConfig).fields([
  { name: 'moviePoster', maxCount: 1 },
  { name: 'bookCover', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
]);

// --- NEW: Middleware for Single Profile Picture Upload ---
// Uses upload.single() for one file expected on the 'profilePicture' field
const uploadProfilePicture = multer(baseMulterConfig).single('profilePicture');


// --- Export BOTH middleware instances (named exports) ---
export { uploadConnectionImages, uploadProfilePicture };

// Note: Changed default export to named exports
// Make sure to update the import in connectionRoutes.js if needed!
// e.g., import { uploadConnectionImages } from '../middleware/uploadMiddleware.js';