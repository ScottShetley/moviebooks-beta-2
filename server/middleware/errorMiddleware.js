// server/middleware/errorMiddleware.js

// Middleware to handle errors passed via next(err)
const errorHandler = (err, req, res, next) => {
    // Sometimes an error might come through with a 200 status code, default to 500 then
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
  
    console.error("ERROR STACK:", err.stack); // Log the full stack trace for debugging
  
    res.json({
      message: err.message,
      // Only include the stack trace in the response during development
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  
  // Middleware to handle 404 Not Found errors (when no route matches)
  const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    // Pass the error to the general errorHandler
    next(error);
  };
  
  module.exports = { errorHandler, notFound };