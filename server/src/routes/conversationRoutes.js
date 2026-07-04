import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all endpoints
router.use(protect);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);

export default router;
