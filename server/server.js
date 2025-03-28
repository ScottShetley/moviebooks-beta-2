// server/server.js (Updated Version with CORS Environment Variable)
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db.js');
const { notFound } = require('./middleware/errorMiddleware.js'); // Keep your existing notFound

// --- Import Route Files ---
const authRoutes = require('./routes/authRoutes.js');
const connectionRoutes = require('./routes/connectionRoutes.js');
const movieRoutes = require('./routes/movieRoutes.js');
const bookRoutes = require('./routes/bookRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
// --- ---

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- Determine CORS origin ---
// Read the allowed origin from environment variables for production, fallback for development
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN_URL // <-- Read from this new env var in production
    : 'http://localhost:3000';      // Allow localhost in development

// --- CORS Middleware ---
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) OR
    // if the origin explicitly matches our allowed origin.
    if (!origin || allowedOrigin === origin) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin '${origin}' not allowed. Allowed: '${allowedOrigin}'`);
      callback(new Error('Not allowed by CORS')); // Deny the request
    }
  },
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
// Log the origin being used by CORS configuration
console.log(`CORS Configured: Allowing origin -> ${allowedOrigin || 'requests with no origin (e.g., server-to-server)'}`);
app.use(cors(corsOptions)); // Apply CORS middleware
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
    // Simple production request logging (optional)
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

// --- Serve Static Files (Uploaded Images - Keep for old data if needed) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- ---

// --- Production Static Build Serve (Keep for later deployment, though not used by backend itself) ---
if (process.env.NODE_ENV === 'production') {
  // This check is likely irrelevant now as backend doesn't serve frontend build
  const clientBuildPath = path.join(__dirname, '../client/build');
  if (!require('fs').existsSync(clientBuildPath)) {
      console.warn("Production mode: Client build folder not found at:", clientBuildPath, "(Expected for backend service)");
  }
}
// Basic root route for API health check
app.get('/', (req, res) => {
  res.send(`MovieBooks API is running... (${process.env.NODE_ENV || 'development'} Mode)`);
});
// --- ---

// --- Error Handling Middleware ---
// 1. Catch 404s (routes not found)
app.use(notFound);

// 2. Catch all other errors - Use detailed inline handler
app.use((err, req, res, next) => {
  // Check if the error is a CORS error generated by our corsOptions function
  const isCorsError = err.message === 'Not allowed by CORS';
  const statusCode = isCorsError ? 403 : (res.statusCode === 200 ? 500 : res.statusCode); // 403 Forbidden for CORS errors

  console.error('--- DETAILED ERROR HANDLER ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('Status Code:', statusCode);
  console.error('Error Message:', err.message);
  if (!isCorsError) { // Don't log full stack for expected CORS denials
      console.error('Full Error Object:', err);
      console.error('Stack Trace:', err.stack);
  }
  console.error('--- END DETAILED ERROR ---');

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});
// --- ---

const PORT = process.env.PORT || 5001; // Render provides the PORT env var

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));