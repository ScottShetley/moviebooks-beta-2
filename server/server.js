// server/server.js (Updated Version with Enhanced Logging)
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db.js');
// --- Use your existing notFound, but we'll use an inline errorHandler for debugging ---
const { notFound } = require('./middleware/errorMiddleware.js');

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

// --- CORS Middleware ---
// Allow requests from your React app's origin (adjust for production)
const corsOptions = {
  // Update this for production deployment!
  origin: process.env.NODE_ENV === 'production' ? 'YOUR_PRODUCTION_FRONTEND_URL' : 'http://localhost:3000',
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
// --- ---

// --- Body Parser Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- ---

// --- Basic Logging Middleware (Kept your existing) ---
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
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

// --- Serve Static Files (Uploaded Images - Keep for old data) ---
// This serves files from the local 'uploads' folder if requested.
// New images come from Cloudinary, but old ones might still use this.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- ---

// --- Production Static Build Serve (Keep for later deployment) ---
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  if (require('fs').existsSync(clientBuildPath)) {
      console.log(`Production mode: Serving static files from ${clientBuildPath}`);
      app.use(express.static(clientBuildPath));
      // Send index.html for any route not handled by API or static files
      app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
      );
  } else {
      console.warn("Production mode: Client build folder not found at:", clientBuildPath);
       app.get('/', (req, res) => {
         res.send('MovieBooks API is running (Production mode - Client build not found)');
       });
  }
} else {
  // Basic root route for development API check
  app.get('/', (req, res) => {
    res.send('MovieBooks API is running... (Development Mode)');
  });
}
// --- ---

// --- Error Handling Middleware ---
// IMPORTANT: These MUST come AFTER the routes have been mounted

// 1. Catch 404s (routes not found) - Use your existing 'notFound'
app.use(notFound);

// 2. Catch all other errors - Using detailed inline handler for debugging
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Use existing status code if set, else 500
  console.error('--- DETAILED ERROR HANDLER ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('Status Code:', statusCode);
  console.error('Error Message:', err.message);
  console.error('Full Error Object:', err); // Log the whole object
  console.error('Stack Trace:', err.stack); // Log the stack
  console.error('--- END DETAILED ERROR ---');

  res.status(statusCode).json({
    message: err.message,
    // Only include stack trace in development environment for security
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});
// --- ---

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));