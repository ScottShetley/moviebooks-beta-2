// server/server.js (Converted to ES Modules)

// TEMPORARILY HARDCODE NODE_ENV for debugging static file serving (REMOVED)
// END TEMPORARY HARDCODE (REMOVED)

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed to replicate __dirname
import fs from 'fs'; // Import fs for checking client build path

// --- Import Custom Modules ---
import connectDB from './config/db.js';
import { notFound } from './middleware/errorMiddleware.js';

// --- Import Route Files ---
import authRoutes from './routes/authRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import followRoutes from './routes/followRoutes.js';


// --- Replicate __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- ---

// Load environment variables
dotenv.config();


// *** Added Console Log for NODE_ENV verification (REMOVED) ***
// ***************************************** (REMOVED)


// Connect to MongoDB
connectDB();

const app = express();

// --- Determine CORS origin ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN_URL // Use CLIENT_ORIGIN_URL for production
    : 'http://localhost:3000'; // Default to localhost:3000 for development

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or server-to-server requests)
    // and allow the specific allowedOrigin
    if (!origin || origin === "null" || allowedOrigin === origin) {
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


// --- Body Parser Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Serve Static Files (Uploaded Images) ---
// This should be available in both production and development
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Basic Logging Middleware ---
// This block runs if NODE_ENV is 'development' (set by cross-env in package.json)
if (process.env.NODE_ENV === 'development') {
    console.log("Running in Development mode."); // Keep this confirmation log

    // Serve static files from client/public in development
    // This allows frontend to request assets like default avatars directly from backend during dev
    // Make sure this comes *before* API routes or any specific development-only routes
    const staticPublicPath = path.join(__dirname, '../client/public');
    // *** ADDED THIS LOG LINE TO SHOW THE STATIC PATH (REMOVED) ***
    // **************************************************** (REMOVED)

    app.use(express.static(staticPublicPath)); // This should now be active

    app.use((req, res, next) => {
        // Only log if not requesting a static file from client public, build or uploads
        if (!req.originalUrl.startsWith('/images/') && !req.originalUrl.startsWith('/static/') && !req.originalUrl.startsWith('/uploads/')) {
             console.log(`${req.method} ${req.originalUrl}`);
        }
        next();
    });
} else {
    // This block runs if NODE_ENV is not 'development' (e.g., production)
     app.use((req, res, next) => {
        // Only log if not requesting a static file from client build or uploads
         if (!req.originalUrl.startsWith('/static/') && !req.originalUrl.startsWith('/uploads/')) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} (Origin: ${req.headers.origin || 'N/A'})`);
         }
        next();
    });
}


// --- Mount API Routes ---
// Order matters: API routes should be processed after static file serving in development,
// but before the production static file or SPA fallback routes.
// In development, static files from client/public and uploads are served first.
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/follows', followRoutes);


// --- Serve Client Build in Production ---
const clientBuildPath = path.resolve(__dirname, '../client/build');

// In production, serve the static files from the client/build directory
if (process.env.NODE_ENV === 'production') {
  if (!fs.existsSync(clientBuildPath)) {
      console.error("Production mode: Client build folder not found at:", clientBuildPath);
      // Optionally, exit or throw error if build is missing in prod
      // process.exit(1);
  } else {
      console.log("Serving client build from:", clientBuildPath);
      // Serve static assets from the build directory (CSS, JS, images, etc.)
      // This should come AFTER API routes and /uploads static route
      app.use(express.static(clientBuildPath));

      // --- SPA Fallback Route ---
      // For any GET request that is not an API call, /uploads, or a static file from the build,
      // serve index.html. React Router will then handle the path.
      // This should be the LAST GET route handler before the 404 middleware.
      app.get('*', (req, res) => {
          // Add a log to confirm this route is being hit
           console.log(`SPA Fallback: Serving index.html for ${req.originalUrl}`);
           res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
      // --- END SPA Fallback ---
  }
} else {
    // In development, provide a simple root message as the frontend is served by Create React App's server (localhost:3000)
    // Static files from client/public are served by the express.static middleware added above.
     app.get('/', (req, res) => {
        res.send(`MovieBooks API is running... (${process.env.NODE_ENV || 'development'} Mode)`);
      });
      // Note: No catch-all needed here because webpack-dev-server handles frontend routing.
}


// --- Error Handling Middleware ---
// 1. Catch 404s (These will only be hit if the request wasn't caught by API routes, /uploads, client/public static in dev, or the production SPA fallback)
app.use(notFound);

// 2. Catch all other errors
app.use((err, req, res, next) => {
  const isCorsError = err.message === 'Not allowed by CORS';
  // Determine status code: use the error's status if available, or 500 if it was a 200 response before error
  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);

  console.error('--- DETAILED ERROR HANDLER ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('Status Code:', statusCode);
  console.error('Error Message:', err.message);
  // Log stack trace only if not a CORS error and in development or test environment
  if (!isCorsError && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
       console.error('Stack Trace:', err.stack);
  }
  console.error('--- END DETAILED ERROR ---');

  res.status(statusCode).json({
    message: err.message,
    // Only include stack trace in development/test environments
    stack: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? err.stack : null,
  });
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));