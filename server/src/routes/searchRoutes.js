import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { handleGlobalSearch } from '../controllers/searchController.js';

const router = express.Router();

// Apply JWT verification middleware
router.get('/', protect, handleGlobalSearch);

export default router;
