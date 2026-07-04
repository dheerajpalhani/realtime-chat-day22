/**
 * Middleware to handle 404 Not Found errors for invalid routes.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global centralized error handling middleware.
 * Customizes errors for Mongoose validation/cast issues, JWT expiration, and duplicate keys.
 */
export const errorHandler = (err, req, res, next) => {
  // Determine status code (default to 500 if status is currently 200 or not set)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.status) {
    statusCode = err.status;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found - Invalid ID';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((el) => el.message);
  }

  // Mongoose Duplicate Key Error (e.g., email already exists)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered for ${field}`;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
