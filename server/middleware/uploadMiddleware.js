// server/middleware/uploadMiddleware.js (ES Modules Corrected)
import multer from 'multer'; // Use import
import {CloudinaryStorage} from 'multer-storage-cloudinary'; // Use import (named)
import cloudinary from '../config/cloudinary.js'; // Use import (default, add .js)
import path from 'path'; // Use import

// --- Cloudinary Storage Configuration ---
const storage = new CloudinaryStorage ({
  cloudinary: cloudinary, // Use the imported cloudinary instance
  params: (req, file) => {
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'moviebooks_dev';
    const uniqueSuffix = Date.now ();
    const originalNameWithoutExt = path.parse (file.originalname).name;
    const sanitizedOriginalName = originalNameWithoutExt.replace (
      /[^a-zA-Z0-9]/g,
      '_'
    );
    const filename = `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`;

    console.log (
      `[Cloudinary Storage] Uploading ${file.originalname} as ${folder}/${filename}`
    );

    return {
      folder: folder,
      public_id: filename,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    };
  },
});

// --- File Filter Function ---
function checkFileType (file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test (
    path.extname (file.originalname).toLowerCase ()
  );
  const mimetype = filetypes.test (file.mimetype);

  if (mimetype && extname) {
    console.log (
      `[File Filter] Accepting file: ${file.originalname} (Type: ${file.mimetype})`
    );
    return cb (null, true);
  } else {
    console.log (
      `[File Filter] Rejecting file: ${file.originalname} (Type: ${file.mimetype})`
    );
    cb (new Error ('Error: Images Only! (jpeg, jpg, png, gif)'), false);
  }
}

// --- Initialize Multer ---
const upload = multer ({
  storage: storage,
  limits: {fileSize: 5 * 1024 * 1024}, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType (file, cb);
  },
});

// --- Middleware Instance ---
const uploadConnectionImages = upload.fields ([
  {name: 'moviePoster', maxCount: 1},
  {name: 'bookCover', maxCount: 1},
  {name: 'screenshot', maxCount: 1},
]);

// --- Export Middleware ---
export default uploadConnectionImages; // This was already correct
