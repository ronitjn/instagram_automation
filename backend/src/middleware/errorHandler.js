const oauthConfig = require('../config/oauth');

/**
 * Global Error Handling Middleware
 *
 * Catches and processes all errors from routes and middleware
 * Returns appropriate HTTP status codes and user-friendly error messages
 */

/**
 * Error handler middleware
 * Must be defined with 4 parameters (err, req, res, next) for Express to recognize it
 */
function errorHandler(err, req, res, next) {
  // Log detailed error information server-side
  console.error('Error caught by error handler:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Prepare error response
  const errorResponse = {
    error: err.message || 'An unexpected error occurred',
    success: false
  };

  // In development mode, include additional debug information
  if (oauthConfig.nodeEnv === 'development') {
    errorResponse.debug = {
      stack: err.stack,
      statusCode: statusCode,
      name: err.name
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Handles requests to undefined routes
 */
function notFoundHandler(req, res) {
  console.log(`404 Not Found: ${req.method} ${req.url}`);

  res.status(404).json({
    error: 'Route not found',
    success: false,
    path: req.url,
    method: req.method
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
