// server/server.js (ES Modules)
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// import fs from 'fs'; // No longer needed if not checking client build path

// --- Import Custom Modules ---
import connectDB from './config/db.js';
// Import BOTH error handlers from the dedicated middleware file
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// --- Import Route Files ---
import authRoutes from './routes/authRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
// --- ---

// --- Replicate __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- ---

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// --- Determine CORS origin based on environment ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN_URL // Your deployed frontend URL
    : 'http://localhost:3000'; // Your local development frontend URL

// --- CORS Middleware ---
// Configure Cross-Origin Resource Sharing options.
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from the allowed origin.
    if (!origin || allowedOrigin === origin) {
      callback(null, true);
    } else {
      // Log CORS errors for easier debugging.
      console.error(`CORS Error: Origin '${origin}' not allowed. Allowed: '${allowedOrigin}'`);
      callback(new Error('Not allowed by CORS')); // Reject request
    }
  },
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
// --- Debug log removed ---
// console.log(`CORS Configured: Allowing origin -> ${allowedOrigin || 'requests with no origin'}`);
app.use(cors(corsOptions));
// --- ---

// --- Body Parser Middleware ---
// Parse incoming JSON payloads (needed for POST/PUT requests with JSON body)
app.use(express.json());
// Parse incoming URL-encoded payloads (needed for traditional form submissions)
app.use(express.urlencoded({ extended: true }));
// --- ---

// --- Basic Request Logging Middleware ---
// Consider replacing with a more robust logger like 'morgan' for production.
// Example: import morgan from 'morgan'; app.use(morgan('combined'));
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
        next();
    });
} else {
     // Basic production logging with timestamp and origin
     app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} (Origin: ${req.headers.origin || 'N/A'})`);
        next();
    });
}
// --- ---

// --- Mount API Routes ---
// Define the base path for each feature's routes.
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
// --- ---

// --- Serve Static Files (Uploaded Images) --- REMOVED ---
// Serving local 'uploads' folder is generally not suitable for production/ephemeral filesystems.
// Rely on Cloudinary URLs provided during upload.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- ---

// --- Production Static Build Serving --- REMOVED ---
// This section is typically not needed when deploying frontend and backend separately
// (e.g., Render Static Site + Web Service). Remove if not serving client build from backend.
// if (process.env.NODE_ENV === 'production') { ... }
// --- ---

// --- Basic Root Route ---
// Provides a simple health check endpoint for the API.
app.get('/', (req, res) => {
  res.send(`MovieBooks API is running... (${process.env.NODE_ENV || 'development'} Mode)`);
});
// --- ---

// --- Error Handling Middleware ---
// These MUST be defined AFTER all other app.use() and routes calls.

// 1. Catch 404s: If a request reaches this point, no route matched.
// Use the imported 'notFound' middleware.
app.use(notFound);

// 2. Catch all other errors: Express recognizes middleware with 4 arguments as error handlers.
// Use the imported 'errorHandler' middleware for consistent error response format and logging.
app.use(errorHandler);
// --- ---

// --- Start Server ---
const PORT = process.env.PORT || 5001; // Use port from environment or default to 5001

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
// --- ---
