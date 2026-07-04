import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

/**
 * @desc    Send a message within a conversation
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessage = async (req, res) => {
  const senderId = req.user._id;
  const { conversationId, receiverId, message, messageType } = req.body;

  // 1. Verify that the conversation exists
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // 2. Verify that the sender is a participant in this conversation
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error('Not authorized to send messages in this conversation');
  }

  // 3. Save new message
  const newMessage = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    message,
    messageType: messageType || 'text',
  });

  // 4. Update the conversation metadata
  conversation.lastMessage = newMessage._id;
  conversation.lastMessageText = messageType === 'text' ? message : `[Sent a ${messageType}]`;
  conversation.lastMessageAt = newMessage.createdAt;
  await conversation.save();

  // Populate references
  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', '-password')
    .populate('receiver', '-password');

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: populatedMessage,
  });
};

/**
 * @desc    Get all messages for a specific conversation with pagination
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  // 1. Verify that the conversation exists and the user is a participant
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
  if (!conversation) {
    res.status(403);
    throw new Error('Not authorized to access this conversation');
  }

  // 2. Handle pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  // 3. Query the database (sorting by latest first for pagination skip/limit)
  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', '-password')
    .populate('receiver', '-password')
    .lean();

  // 4. Reverse array to return chronological order (newest messages at bottom)
  messages.reverse();

  res.status(200).json({
    success: true,
    message: 'Messages retrieved successfully',
    data: messages,
  });
};

/**
 * @desc    Soft-delete a message (only by the sender)
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
export const deleteMessage = async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;

  // 1. Locate message
  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // 2. Authorize: Only the sender can delete their message
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this message');
  }

  // 3. Soft delete (set isDeleted to true)
  message.isDeleted = true;
  await message.save();

  // Populate and return updated state
  const updatedMessage = await Message.findById(message._id)
    .populate('sender', '-password')
    .populate('receiver', '-password');

  res.status(200).json({
    success: true,
    message: 'Message soft-deleted successfully',
    data: updatedMessage,
  });
};
