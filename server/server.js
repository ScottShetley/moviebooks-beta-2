// server/server.js (Updated Version)
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db.js');
const { errorHandler, notFound } = require('./middleware/errorMiddleware.js'); // Import error handlers

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
  origin: process.env.NODE_ENV === 'production' ? 'YOUR_PRODUCTION_FRONTEND_URL' : 'http://localhost:3000',
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
// --- ---

// --- Body Parser Middleware ---
// Allow express to parse JSON bodies and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- ---

// --- Basic Logging Middleware (Optional) ---
// Simple logger to see incoming requests in the console
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
        next();
    });
}
// --- ---

// --- Mount Routes ---
// Tell Express to use the imported route handlers for specific base paths
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
// --- ---

// --- Serve Static Files (Uploaded Images) ---
// Make the 'uploads' directory publicly accessible via the '/uploads' URL path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- ---

// --- Production Static Build Serve (Keep for later deployment) ---
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  if (require('fs').existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
      );
  } else {
      console.log("Client build folder not found at:", clientBuildPath);
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
app.use(notFound);      // Catch 404s and forward to error handler
app.use(errorHandler);  // Handle all other errors passed via next(error)
// --- ---

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));