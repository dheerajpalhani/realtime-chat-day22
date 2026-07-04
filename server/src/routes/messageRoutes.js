import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendMessageValidator } from '../validations/messageValidation.js';

const router = express.Router();

// Apply auth protection middleware to all endpoints
router.use(protect);

router.post('/', sendMessageValidator, sendMessage);
router.get('/:conversationId', getMessages);
router.delete('/:id', deleteMessage);

export default router;
