import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { streamAIChat, getAIHistory } from '../controllers/aiController.js';

const router = express.Router();

// Enforce JWT check on all AI workspace paths
router.use(protect);

router.get('/history', getAIHistory);
router.post('/chat', streamAIChat);

export default router;
