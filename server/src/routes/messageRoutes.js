import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
  toggleReaction,
  togglePin,
  toggleStar,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendMessageValidator } from '../validations/messageValidation.js';

const router = express.Router();

router.use(protect);

router.post('/', sendMessageValidator, sendMessage);
router.get('/:conversationId', getMessages);
router.delete('/:id', deleteMessage);
router.put('/:id', editMessage);
router.post('/:id/reaction', toggleReaction);
router.post('/:id/pin', togglePin);
router.post('/:id/star', toggleStar);

export default router;
