// server/middleware/uploadMiddleware.js
import multer from 'multer'; // Use import
import { CloudinaryStorage } from 'multer-storage-cloudinary'; // Use import for named export
import cloudinary from '../config/cloudinary.js'; // Use import, add .js extension
import path from 'path'; // Use import

console.log('[uploadMiddleware] Middleware file loaded and configuring (ESM)...');

// --- Cloudinary Storage Configuration ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Passed configured instance
  params: (req, file) => {
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'moviebooks_dev';
    // Generate a unique public ID (filename in Cloudinary)
    const uniqueSuffix = Date.now();
    const originalNameWithoutExt = path.parse(file.originalname).name;
    const sanitizedOriginalName = originalNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`;

    console.log(`[Cloudinary Storage] Uploading ${file.originalname} as ${folder}/${filename} for field ${file.fieldname}`);

    return {
      folder: folder,
      public_id: filename, // Use generated filename as public_id
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    };
  },
});


// --- File Filter Function ---
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log(`[File Filter] Accepting file: ${file.originalname} (Type: ${file.mimetype}) for field ${file.fieldname}`);
    return cb(null, true); // Accept file
  } else {
    console.log(`[File Filter] Rejecting file: ${file.originalname} (Type: ${file.mimetype}) for field ${file.fieldname}`);
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'), false); // Reject file
  }
}

// --- Initialize Multer ---
const upload = multer ({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    console.log(`[multer fileFilter] Checking file: ${file.originalname} for field ${file.fieldname}`);
    checkFileType(file, cb);
  },
});

// --- Middleware Instance for Specific Fields ---
const uploadConnectionImages = upload.fields([
  { name: 'moviePoster', maxCount: 1 },
  { name: 'bookCover', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
]);

// --- Export the configured middleware instance using default export ---
export default uploadConnectionImages;