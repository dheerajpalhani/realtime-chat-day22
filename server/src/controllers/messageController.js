import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { isUserOnline } from '../utils/onlineUsers.js';

/**
 * @desc    Send a message within a conversation
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessage = async (req, res) => {
  const senderId = req.user._id;
  const { conversationId, receiverId, message, messageType, replyTo } = req.body;

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

  // 3. Determine if receiver is online to set status
  const receiverOnline = isUserOnline(receiverId);
  const status = receiverOnline ? 'delivered' : 'sent';

  // 4. Save new message
  const newMessage = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    message,
    messageType: messageType || 'text',
    replyTo: replyTo || null,
    status,
  });

  // 5. Update the conversation metadata
  conversation.lastMessage = newMessage._id;
  conversation.lastMessageText = messageType === 'text' ? message : `[Sent a ${messageType}]`;
  conversation.lastMessageAt = newMessage.createdAt;
  await conversation.save();

  // Populate references
  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', '-password')
    .populate('receiver', '-password')
    .populate('replyTo')
    .lean();

  // 6. Emit real-time events via Socket.IO
  const io = req.app.get('io');
  if (io) {
    // Relay the message to the conversation room
    io.to(conversationId).emit('receive-message', populatedMessage);

    // If online, broadcast message-delivered to the room
    if (receiverOnline) {
      io.to(conversationId).emit('message-delivered', {
        conversationId,
        messageId: newMessage._id,
        status: 'delivered',
      });
    }
  }

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
    .populate('replyTo')
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

/**
 * @desc    Edit a message (only by the sender)
 * @route   PUT /api/messages/:id
 * @access  Private
 */
export const editMessage = async (req, res) => {
  const messageId = req.params.id;
  const { message } = req.body;
  const userId = req.user._id;

  const msg = await Message.findOne({ _id: messageId, sender: userId });
  if (!msg) {
    res.status(404);
    throw new Error('Message not found or access denied');
  }

  msg.message = message;
  msg.edited = true;
  await msg.save();

  const updatedMessage = await Message.findById(msg._id)
    .populate('sender receiver', '-password')
    .populate('replyTo')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Message edited successfully',
    data: updatedMessage,
  });
};

/**
 * @desc    Toggle emoji reaction on a message
 * @route   POST /api/messages/:id/reaction
 * @access  Private
 */
export const toggleReaction = async (req, res) => {
  const messageId = req.params.id;
  const { emoji } = req.body;
  const userId = req.user._id;

  const msg = await Message.findById(messageId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  const existingReactionIndex = msg.reactions.findIndex(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingReactionIndex > -1) {
    if (msg.reactions[existingReactionIndex].emoji === emoji) {
      // Remove reaction if same emoji
      msg.reactions.splice(existingReactionIndex, 1);
    } else {
      // Update emoji if different
      msg.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Add new reaction
    msg.reactions.push({ user: userId, emoji });
  }

  await msg.save();

  const updatedMessage = await Message.findById(msg._id)
    .populate('sender receiver', '-password')
    .populate('replyTo')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Reaction updated successfully',
    data: updatedMessage,
  });
};

/**
 * @desc    Toggle pin status on a message
 * @route   POST /api/messages/:id/pin
 * @access  Private
 */
export const togglePin = async (req, res) => {
  const messageId = req.params.id;

  const msg = await Message.findById(messageId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  msg.pinned = !msg.pinned;
  await msg.save();

  const updatedMessage = await Message.findById(msg._id)
    .populate('sender receiver', '-password')
    .populate('replyTo')
    .lean();

  res.status(200).json({
    success: true,
    message: msg.pinned ? 'Message pinned' : 'Message unpinned',
    data: updatedMessage,
  });
};

/**
 * @desc    Toggle star status on a message
 * @route   POST /api/messages/:id/star
 * @access  Private
 */
export const toggleStar = async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;

  const msg = await Message.findById(messageId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  const isStarred = msg.starredBy.includes(userId);
  if (isStarred) {
    msg.starredBy = msg.starredBy.filter((id) => id.toString() !== userId.toString());
  } else {
    msg.starredBy.push(userId);
  }

  await msg.save();

  const updatedMessage = await Message.findById(msg._id)
    .populate('sender receiver', '-password')
    .populate('replyTo')
    .lean();

  res.status(200).json({
    success: true,
    message: isStarred ? 'Message unstarred' : 'Message starred',
    data: updatedMessage,
  });
};
