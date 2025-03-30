// server/middleware/errorMiddleware.js (Corrected for Named Exports)

// Middleware to handle errors passed via next(err)
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status (statusCode);

  console.error ('--- ERROR HANDLER CAUGHT ---');
  console.error ('Status Code:', statusCode);
  console.error ('Message:', err.message);
  console.error ('Stack:', err.stack);
  console.error ('--- END ERROR ---');

  res.json ({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// Middleware to handle 404 Not Found errors
const notFound = (req, res, next) => {
  const error = new Error (`Not Found - ${req.method} ${req.originalUrl}`);
  res.status (404);
  next (error);
};

// --- Use NAMED exports ---
export {errorHandler, notFound}; // <-- USE NAMED EXPORT
