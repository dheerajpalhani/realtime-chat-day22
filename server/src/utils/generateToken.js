import jwt from 'jsonwebtoken';

/**
 * Generates an Access Token and a secure Refresh Token cookie for cookie-based authentication.
 * @param {Object} res - Express response object
 * @param {string} userId - The user ID to encode
 * @returns {string} The signed JWT Access Token
 */
const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in the environment variables');
  }

  // 1. Sign access token (7-day duration)
  const token = jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 2. Sign long-lived refresh token (30-day duration)
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback_key_4567';
  const refreshToken = jwt.sign({ id: userId }, refreshSecret, {
    expiresIn: '30d',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

export default generateToken;
