// server/server.js (Converted to ES Modules)
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed to replicate __dirname
import fs from 'fs'; // Import fs for checking client build path

// --- Import Custom Modules ---
import connectDB from './config/db.js';
import { notFound } from './middleware/errorMiddleware.js'; // Ensure this file uses export

// --- Import Route Files ---
import authRoutes from './routes/authRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
// --- ---

// --- Replicate __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- ---

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- Determine CORS origin ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN_URL
    : 'http://localhost:3000';

// --- CORS Middleware ---
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigin === origin) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin '${origin}' not allowed. Allowed: '${allowedOrigin}'`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
console.log(`CORS Configured: Allowing origin -> ${allowedOrigin || 'requests with no origin (e.g., server-to-server)'}`);
app.use(cors(corsOptions));
// --- ---

// --- Body Parser Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- ---

// --- Basic Logging Middleware ---
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
        next();
    });
} else {
     app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} (Origin: ${req.headers.origin || 'N/A'})`);
        next();
    });
}
// --- ---

// --- Mount Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
// --- ---

// --- Serve Static Files (Uploaded Images) ---
// Use the derived __dirname
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- ---

// --- Production Static Build Check ---
// This section might be less relevant if your frontend is a separate static site on Render
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../client/build'); // Use path.resolve for better cross-platform path handling
  // Use imported fs instead of require('fs')
  if (!fs.existsSync(clientBuildPath)) {
      console.warn("Production mode: Client build folder not found at:", clientBuildPath);
  }
  // Note: Serving the client build from the backend is usually not done when
  // deploying frontend and backend separately (like Render Static Site + Web Service).
  // Consider removing this section if not needed.
}
// Basic root route for API health check
app.get('/', (req, res) => {
  res.send(`MovieBooks API is running... (${process.env.NODE_ENV || 'development'} Mode)`);
});
// --- ---

// --- Error Handling Middleware ---
// 1. Catch 404s (Must use imported 'notFound' function)
app.use(notFound); // Ensure errorMiddleware.js exports 'notFound'

// 2. Catch all other errors
app.use((err, req, res, next) => {
  const isCorsError = err.message === 'Not allowed by CORS';
  const statusCode = isCorsError ? 403 : (res.statusCode === 200 ? 500 : res.statusCode);

  console.error('--- DETAILED ERROR HANDLER ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('Status Code:', statusCode);
  console.error('Error Message:', err.message);
  if (!isCorsError) {
      // Avoid logging full stack for expected CORS denials
      // console.error('Full Error Object:', err); // Optional: Can be noisy
      console.error('Stack Trace:', err.stack);
  }
  console.error('--- END DETAILED ERROR ---');

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});
// --- ---

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));