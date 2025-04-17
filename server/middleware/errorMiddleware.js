// server/middleware/errorMiddleware.js

/**
 * Custom error handling middleware for Express.
 * Catches errors passed via next(err) and formats the response.
 * Logs the error details to the console for server-side diagnostics.
 * Must be the LAST middleware registered with app.use() that takes 4 arguments.
 */
const errorHandler = (err, req, res, next) => {
  // Determine the status code: Use the status code set on the response before the error,
  // but default to 500 (Internal Server Error) if the status code is still 200 (OK).
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode); // Set the final status code for the response.

  // Log the error details server-side (essential for production monitoring).
  console.error('--- ERROR HANDLER CAUGHT ---');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', `${req.method} ${req.originalUrl}`);
  console.error('Status Code:', statusCode);
  console.error('Message:', err.message);
  // Log the stack trace regardless of environment for server logs.
  console.error('Stack:', err.stack);
  console.error('--- END ERROR ---');

  // Send a JSON response to the client.
  res.json({
    message: err.message,
    // Include the stack trace in the response only during development for debugging.
    // Avoid exposing potentially sensitive stack trace details in production.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

/**
 * Middleware to handle requests that don't match any defined routes (404 Not Found).
 * Creates a new Error object with a helpful message and passes it to the next
 * middleware in the stack (which should be the `errorHandler`).
 * Should be placed just before the `errorHandler` in the middleware chain.
 */
const notFound = (req, res, next) => {
  // Create a new error object indicating the route was not found.
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404); // Set the response status code to 404.
  next(error); // Pass the error object to the next middleware (errorHandler).
};

// --- Use NAMED exports ---
// Export both middleware functions for use in the main server setup file.
export { errorHandler, notFound };
