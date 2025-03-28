// server/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the destination directory for uploads
const uploadDir = path.join(__dirname, '../uploads'); // Go up one level from middleware, then into uploads

// Ensure the 'uploads' directory exists, create it if it doesn't
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir);
    console.log(`Created uploads directory at: ${uploadDir}`);
  } catch (err) {
    console.error(`Error creating uploads directory: ${err}`);
    process.exit(1);
  }
}

// --- Multer Disk Storage Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix);
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
    return cb(null, true); // Accept file
  } else {
    // Reject file with a specific error message
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'));
  }
}

// --- Initialize Multer ---
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  // --- UPDATED: Use .fields() to accept specific named files ---
}).fields([
  { name: 'moviePoster', maxCount: 1 },
  { name: 'bookCover', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
]);
// --- END UPDATE ---

// --- Middleware Function to Use in Routes ---
const handleUpload = (req, res, next) => {
  console.log(
    '[Upload Middleware] Request received for path:',
    req.originalUrl
  );
  console.log(
    '[Upload Middleware] Content-Type Header:',
    req.headers['content-type']
  );

  upload(req, res, function (err) { // Call the configured Multer middleware
    console.log('[Upload Middleware] Multer processing complete.');

    if (err instanceof multer.MulterError) {
      console.error(
        '[Upload Middleware] Multer Error Encountered:',
        err.code,
        '-',
        err.message
      );
      let message = 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File is too large. Maximum size is 5MB per file.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        // This can happen if the frontend sends a field name not defined in .fields()
         message = `Unexpected file field received: ${err.field}. Please use 'moviePoster', 'bookCover', or 'screenshot'.`;
      }
      return res.status(400).json({ message: message });
    } else if (err) {
      // Handle custom filter errors or other unexpected issues
      console.error(
        '[Upload Middleware] File Filter or Other Error:',
        err.message
      );
      return res.status(400).json({ message: err.message }); // e.g., 'Error: Images Only!'
    } else {
      // --- UPDATED: Log uploaded files information ---
      console.log('[Upload Middleware] No upload errors during processing.');
      if (req.files && Object.keys(req.files).length > 0) {
        console.log('[Upload Middleware] req.files is DEFINED. Files uploaded:');
        // Log details for each uploaded file type
        Object.keys(req.files).forEach(fieldName => {
             if (req.files[fieldName] && req.files[fieldName][0]) {
                const file = req.files[fieldName][0];
                console.log(`  - ${fieldName}: ${file.filename} (Size: ${file.size})`);
             }
        });
      } else {
        console.log(
          '[Upload Middleware] req.files is UNDEFINED or EMPTY. (No files uploaded or issue attaching them)'
        );
      }
      // --- END UPDATE ---

      // Proceed to the next middleware (createConnection controller)
      console.log('[Upload Middleware] Calling next().');
      next();
    }
  });
};

module.exports = handleUpload; // Export the wrapper middleware