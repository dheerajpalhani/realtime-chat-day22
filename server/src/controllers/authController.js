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

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
