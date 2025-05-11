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

// --- Trust Proxy for Render ---
app.set('trust proxy', 1);

// --- Determine CORS origin ---
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN_URL
    : 'http://localhost:3000';

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

// --- Helper function to calculate response time ---
const getDurationInMilliseconds = (start) => {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e-6;
    const diff = process.hrtime(start);
    return (diff[0] * NS_PER_SEC + diff[1]) * NS_TO_MS;
};

// --- NEW Detailed Request Logging Middleware ---
app.use((req, res, next) => {
    const start = process.hrtime();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.socket && req.connection.socket.remoteAddress) || 'N/A';
    const userAgent = req.headers['user-agent'] || 'N/A';
    const referer = req.headers['referer'] || req.headers['referrer'] || 'N/A';

    res.on('finish', () => {
        const durationInMilliseconds = getDurationInMilliseconds(start);
        const statusCode = res.statusCode;
        const timestamp = new Date().toISOString();
        console.log(
            `[${timestamp}] ${method} ${url} - STATUS ${statusCode} - IP ${ip} - User-Agent "${userAgent}" - Referer "${referer}" - ${durationInMilliseconds.toFixed(2)} ms`
        );
    });
    next();
});


// --- Serve Static Files (Uploaded Images) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


if (process.env.NODE_ENV === 'development') {
    console.log("Running in Development mode.");
    const staticPublicPath = path.join(__dirname, '../client/public');
    app.use(express.static(staticPublicPath));
}


// --- Sitemap Generation Route ---
const sitemapBaseUrl = process.env.CLIENT_ORIGIN_URL || 'https://movie-books.com';
app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    const links = [];
    try {
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: 1.0 }, { url: '/about', changefreq: 'monthly', priority: 0.7 },
            { url: '/updates', changefreq: 'weekly', priority: 0.7 }, { url: '/all-users', changefreq: 'daily', priority: 0.8 },
            { url: '/login', changefreq: 'yearly', priority: 0.3 }, { url: '/signup', changefreq: 'yearly', priority: 0.3 },
        ];
        staticPages.forEach(page => links.push({ ...page, url: `${sitemapBaseUrl}${page.url}` }));
        const connections = await Connection.find({}).select('_id updatedAt').lean();
        connections.forEach(conn => links.push({ url: `${sitemapBaseUrl}/connections/${conn._id}`, changefreq: 'weekly', priority: 0.9, lastmod: conn.updatedAt ? conn.updatedAt.toISOString() : new Date().toISOString() }));
        const users = await User.find({ isPrivate: false }).select('_id updatedAt').lean();
        users.forEach(user => links.push({ url: `${sitemapBaseUrl}/users/${user._id}`, changefreq: 'weekly', priority: 0.7, lastmod: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString() }));
        const movies = await Connection.aggregate([ { $match: { 'movie.title': { $exists: true, $ne: null }, 'movie.year': { $exists: true, $ne: null } } }, { $group: { _id: { title: '$movie.title', year: '$movie.year' }, lastmod: { $max: '$updatedAt' } } }, { $project: { _id: 0, title: '$_id.title', year: '$_id.year', lastmod: 1 } } ]);
        movies.forEach(movie => { if (movie.title && movie.year) links.push({ url: `${sitemapBaseUrl}/movies/${encodeURIComponent(movie.title)}/${movie.year}`, changefreq: 'monthly', priority: 0.8, lastmod: movie.lastmod ? movie.lastmod.toISOString() : new Date().toISOString() }); });
        const books = await Connection.aggregate([ { $match: { 'book.title': { $exists: true, $ne: null } } }, { $group: { _id: { title: '$book.title', author: '$book.author' }, lastmod: { $max: '$updatedAt' } } }, { $project: { _id: 0, title: '$_id.title', author: '$_id.author', lastmod: 1 } } ]);
        books.forEach(book => { if (book.title) { const bookAuthor = book.author ? encodeURIComponent(book.author) : 'Unknown'; links.push({ url: `${sitemapBaseUrl}/books/${encodeURIComponent(book.title)}/${bookAuthor}`, changefreq: 'monthly', priority: 0.8, lastmod: book.lastmod ? book.lastmod.toISOString() : new Date().toISOString() }); } });
        const stream = new SitemapStream({ hostname: sitemapBaseUrl });
        const xml = await streamToPromise(Readable.from(links).pipe(stream));
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).end();
    }
});

// --- Mount API Routes ---
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

      // === START: TEMPORARY DEBUG LOGGING ===
      app.use((req, res, next) => {
        if (req.originalUrl === '/logo192.png' || req.originalUrl === '/logo512.png') {
          console.log(`DEBUG: Request for ${req.originalUrl} BEFORE express.static.`);
          // Check if the file physically exists where express.static will look
          const filePath = path.join(clientBuildPath, req.originalUrl.substring(1)); // remove leading /
          if (fs.existsSync(filePath)) {
            console.log(`DEBUG: File ${filePath} EXISTS on disk.`);
          } else {
            console.error(`DEBUG: File ${filePath} DOES NOT EXIST on disk.`);
          }
        }
        next();
      });
      // === END: TEMPORARY DEBUG LOGGING ===

      app.use(express.static(clientBuildPath));

      // === START: TEMPORARY DEBUG LOGGING FOR SPA FALLBACK ===
      app.get('*', (req, res, next) => {
           if (req.originalUrl === '/sitemap.xml') {
               return next(); // Let sitemap handler take it
           }
           // If it's a request for our specific logos and it reached here, express.static didn't serve it
           if (req.originalUrl === '/logo192.png' || req.originalUrl === '/logo512.png') {
             console.error(`DEBUG: Request for ${req.originalUrl} FELL THROUGH to SPA fallback. express.static FAILED to serve it.`);
           }
           // Original SPA fallback logic
           // console.log(`SPA Fallback: Serving index.html for ${req.originalUrl}`); // Optional
           res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
      // === END: TEMPORARY DEBUG LOGGING FOR SPA FALLBACK ===
  }
} else {
     // Development mode: a simple message for the root.
     app.get('/', (req, res) => {
        res.send(`MovieBooks API is running... (${process.env.NODE_ENV || 'development'} Mode)`);
      });
}


// --- Error Handling Middleware ---
app.use(notFound);

app.use((err, req, res, next) => {
  const isCorsError = err.message === 'Not allowed by CORS';
  let statusCode = res.statusCode !== 200 ? res.statusCode : (err.status || 500);
  if (isCorsError && !err.status) statusCode = 403;

  console.error('--- DETAILED ERROR HANDLER ---');
  console.error(`[${new Date().toISOString()}] Encountered error for: ${req.method} ${req.originalUrl}`);
  console.error('Status Code to be sent:', statusCode);
  console.error('Error Message:', err.message);
  if (!isCorsError && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
       console.error('Stack Trace:', err.stack);
  }
  console.error('--- END DETAILED ERROR ---');

  if (!res.headersSent) {
    res.status(statusCode).json({
      message: err.message,
      stack: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? err.stack : null,
    });
  } else {
    next(err);
  }
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));