import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  const { name, username, email, password } = req.body;

  // 1. Check if email already exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    res.status(409);
    throw new Error('Email is already registered');
  }

  // 2. Check if username already exists
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    res.status(409);
    throw new Error('Username is already taken');
  }

  // 3. Create user in database
  const user = await User.create({
    name,
    username,
    email,
    password, // Mongoose pre-save hook will hash this
  });

  if (user) {
    // Generate JWT token and set HTTP-only cookie
    generateToken(res, user._id);

    // Build user profile response (excluding sensitive details like password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data provided');
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Locate user by email and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // 2. Validate password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // 3. Generate token & set HTTP-only cookie
  const token = generateToken(res, user._id);

  // Set online status
  user.isOnline = true;
  await user.save();

  // Build user profile response
  const userResponse = {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    isOnline: true,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(200).json({
    success: true,
    token,
    user: userResponse,
  });
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const me = async (req, res) => {
  // req.user is attached by the protect middleware
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc    Log user out & clear token cookie
 * @route   POST /api/auth/logout
 * @access  Public/Private
 */
export const logout = async (req, res) => {
  // Toggle user online status to offline if authenticated
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });
  }

  // Clear token cookie
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0), // Expire cookie immediately
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0), // Expire cookie immediately
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Search users by name or username
 * @route   GET /api/auth/users
 * @access  Private
 */
export const searchUsers = async (req, res) => {
  const search = req.query.search || '';
  
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ],
  })
    .select('-password')
    .limit(10)
    .lean();

  res.status(200).json({
    success: true,
    data: users,
  });
};

/**
 * @desc    Generate a new access token using the refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not provided' });
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback_key_4567';
    const decoded = jwt.verify(refreshToken, refreshSecret);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User profile not found' });
    }

    // Generate new access token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

/**
 * @desc    Verify Google ID Token and register/login user profile
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Google Credential Token is required' });
  }

  try {
    // 1. Fetch Google verification endpoint using node fetch
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!response.ok) {
      return res.status(401).json({ success: false, message: 'Failed to verify Google Credential Token' });
    }

    const payload = await response.json();
    const { email, name, picture, sub } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account is missing email variables' });
    }

    // 2. Query MongoDB by email
    let user = await User.findOne({ email });
    if (!user) {
      // 3. Setup clean username
      let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await User.create({
        name: name || 'Google User',
        username,
        email,
        password: `google_${sub}_dummy_password_${Math.random()}`,
        avatar: picture || '',
        bio: 'Joined ChatFlow using Google OAuth.',
        isOnline: true,
      });
    } else {
      user.isOnline = true;
      await user.save();
    }

    // 4. Generate Access and Refresh Cookies
    const accessToken = generateToken(res, user._id);

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Google OAuth Login failed:', error.message);
    res.status(500).json({ success: false, message: 'Google OAuth failed: ' + error.message });
  }
};
