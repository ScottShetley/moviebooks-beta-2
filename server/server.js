// server/server.js (Converted to ES Modules)

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed to replicate __dirname
import fs from 'fs'; // Import fs for checking client build path

// --- Sitemap Imports ---
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream'; // Needed to convert array of links to a stream

// --- Import Custom Modules ---
import connectDB from './config/db.js';
import { notFound } from './middleware/errorMiddleware.js';

// --- Import Mongoose Models (ensure paths are correct) ---
// --- Import Mongoose Models (ensure paths are correct) ---
import Connection from './models/Connection.js';
import User from './models/User.js';

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

// Connect to MongoDB
connectDB();

const app = express();

// --- Determine CORS origin ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN_URL // Use CLIENT_ORIGIN_URL for production
    : 'http://localhost:3000'; // Default to localhost:3000 for development

const corsOptions = {
  origin: function (origin, callback) {
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Basic Logging Middleware ---
if (process.env.NODE_ENV === 'development') {
    console.log("Running in Development mode.");
    const staticPublicPath = path.join(__dirname, '../client/public');
    app.use(express.static(staticPublicPath));
    app.use((req, res, next) => {
        if (!req.originalUrl.startsWith('/images/') && !req.originalUrl.startsWith('/static/') && !req.originalUrl.startsWith('/uploads/') && req.originalUrl !== '/sitemap.xml') {
             console.log(`${req.method} ${req.originalUrl}`);
        }
        next();
    });
} else {
     app.use((req, res, next) => {
         if (!req.originalUrl.startsWith('/static/') && !req.originalUrl.startsWith('/uploads/') && req.originalUrl !== '/sitemap.xml') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} (Origin: ${req.headers.origin || 'N/A'})`);
         }
        next();
    });
}

// --- Sitemap Generation Route ---
const sitemapBaseUrl = 'https://movie-books.com'; // Your production base URL

app.get('/sitemap.xml', async (req, res) => {
    // Disable logging for sitemap requests in the console to keep it clean
    // console.log('Sitemap requested');
    res.header('Content-Type', 'application/xml');
    const links = [];

    try {
        // 1. Static Pages
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/about', changefreq: 'monthly', priority: 0.7 },
            { url: '/updates', changefreq: 'weekly', priority: 0.7 },
            { url: '/all-users', changefreq: 'daily', priority: 0.8 },
            { url: '/login', changefreq: 'yearly', priority: 0.3 },
            { url: '/signup', changefreq: 'yearly', priority: 0.3 },
        ];
        staticPages.forEach(page => links.push({ ...page, url: `${sitemapBaseUrl}${page.url}` }));

        // 2. Connections
        const connections = await Connection.find({}).select('_id updatedAt').lean();
        connections.forEach(conn => {
            links.push({
                url: `${sitemapBaseUrl}/connections/${conn._id}`,
                changefreq: 'weekly',
                priority: 0.9,
                lastmod: conn.updatedAt ? conn.updatedAt.toISOString() : new Date().toISOString(),
            });
        });

        // 3. Public User Profiles
        const users = await User.find({ isPrivate: false }).select('_id updatedAt').lean();
        users.forEach(user => {
            links.push({
                url: `${sitemapBaseUrl}/users/${user._id}`,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString(),
            });
        });

        // 4. Movie Detail Pages (Derived from Connections)
        const movies = await Connection.aggregate([
            { $match: { 'movie.title': { $exists: true, $ne: null }, 'movie.year': { $exists: true, $ne: null } } },
            { $group: { _id: { title: '$movie.title', year: '$movie.year' }, lastmod: { $max: '$updatedAt' } } },
            { $project: { _id: 0, title: '$_id.title', year: '$_id.year', lastmod: 1 } }
        ]);
        movies.forEach(movie => {
            if (movie.title && movie.year) { // Ensure title and year are present
                 links.push({
                    url: `${sitemapBaseUrl}/movies/${encodeURIComponent(movie.title)}/${movie.year}`,
                    changefreq: 'monthly',
                    priority: 0.8,
                    lastmod: movie.lastmod ? movie.lastmod.toISOString() : new Date().toISOString(),
                });
            }
        });

        // 5. Book Detail Pages (Derived from Connections)
        const books = await Connection.aggregate([
            { $match: { 'book.title': { $exists: true, $ne: null } } }, // Author can be optional for grouping if needed, but good to have for URL
            { $group: { _id: { title: '$book.title', author: '$book.author' }, lastmod: { $max: '$updatedAt' } } },
            { $project: { _id: 0, title: '$_id.title', author: '$_id.author', lastmod: 1 } }
        ]);
        books.forEach(book => {
            if (book.title) { // Ensure title is present
                const bookAuthor = book.author ? encodeURIComponent(book.author) : 'Unknown';
                links.push({
                    url: `${sitemapBaseUrl}/books/${encodeURIComponent(book.title)}/${bookAuthor}`,
                    changefreq: 'monthly',
                    priority: 0.8,
                    lastmod: book.lastmod ? book.lastmod.toISOString() : new Date().toISOString(),
                });
            }
        });

        const stream = new SitemapStream({ hostname: sitemapBaseUrl });
        const xml = await streamToPromise(Readable.from(links).pipe(stream));
        res.send(xml);

    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).end();
    }
});


// --- Mount API Routes ---
// Place API routes *after* the sitemap route if you want /sitemap.xml to be handled by the new handler
// and *before* the production static serving & SPA fallback.
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

if (process.env.NODE_ENV === 'production') {
  if (!fs.existsSync(clientBuildPath)) {
      console.error("Production mode: Client build folder not found at:", clientBuildPath);
  } else {
      console.log("Serving client build from:", clientBuildPath);
      app.use(express.static(clientBuildPath));

      app.get('*', (req, res) => {
           // Check if the request is for sitemap.xml, if so, let the sitemap handler deal with it
           // This check is actually redundant if sitemap route is defined before this '*' route,
           // but kept here as a safeguard or if route order changes.
           if (req.originalUrl === '/sitemap.xml') {
               return next(); // Should be handled by the sitemap route defined earlier
           }
           console.log(`SPA Fallback: Serving index.html for ${req.originalUrl}`);
           res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
  }
} else {
     app.get('/', (req, res) => {
        res.send(`MovieBooks API is running... (${process.env.NODE_ENV || 'development'} Mode)`);
      });
}


// --- Error Handling Middleware ---
app.use(notFound);

app.use((err, req, res, next) => {
  const isCorsError = err.message === 'Not allowed by CORS';
  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);

  console.error('--- DETAILED ERROR HANDLER ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('Status Code:', statusCode);
  console.error('Error Message:', err.message);
  if (!isCorsError && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
       console.error('Stack Trace:', err.stack);
  }
  console.error('--- END DETAILED ERROR ---');

  res.status(statusCode).json({
    message: err.message,
    stack: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? err.stack : null,
  });
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));