import express from 'express';
import { register, login, me, logout, searchUsers } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerValidator, loginValidator } from '../validations/authValidation.js';

const router = express.Router();

// Public Routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);

// Protected Routes (Require valid JWT)
router.get('/me', protect, me);
router.get('/users', protect, searchUsers);
router.post('/logout', protect, logout);

export default router;
