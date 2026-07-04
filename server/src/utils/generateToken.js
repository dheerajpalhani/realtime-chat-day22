import jwt from 'jsonwebtoken';

/**
 * Generates a JWT token for the user, sets it as an HTTP-only secure cookie, and returns the token.
 * @param {Object} res - Express response object
 * @param {string} userId - The user ID to encode in the token
 * @returns {string} The signed JWT token
 */
const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in the environment variables');
  }

  // Sign token with a 7-day expiration
  const token = jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });

  // Configure cookie options
  const cookieOptions = {
    httpOnly: true, // Prevent XSS access
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  // Set cookie
  res.cookie('token', token, cookieOptions);

  return token;
};

export default generateToken;
