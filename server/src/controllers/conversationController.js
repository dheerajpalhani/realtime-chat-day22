import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

/**
 * @desc    Create or retrieve an existing one-to-one conversation between two users
 * @route   POST /api/conversations
 * @access  Private
 */
export const createConversation = async (req, res) => {
  const senderId = req.user._id;
  const { receiverId } = req.body;

  if (!receiverId) {
    res.status(400);
    throw new Error('Receiver ID is required');
  }

  if (senderId.toString() === receiverId.toString()) {
    res.status(400);
    throw new Error('You cannot start a conversation with yourself');
  }

  // 1. Verify recipient user exists
  const receiverExists = await User.findById(receiverId);
  if (!receiverExists) {
    res.status(404);
    throw new Error('Recipient user not found');
  }

  // 2. Generate hash based on sorted IDs to check existing conversation
  const sortedParticipants = [senderId.toString(), receiverId.toString()].sort();
  const hash = sortedParticipants.join('_');

  let conversation = await Conversation.findOne({ participantsHash: hash })
    .populate('participants', '-password')
    .populate('lastMessage');

  if (conversation) {
    return res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: conversation,
    });
  }

  // 3. Create a new conversation if none exists
  conversation = await Conversation.create({
    participants: sortedParticipants,
  });

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate('participants', '-password');

  res.status(201).json({
    success: true,
    message: 'Conversation created successfully',
    data: populatedConversation,
  });
};

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/conversations
 * @access  Private
 */
export const getConversations = async (req, res) => {
  const userId = req.user._id;

  // Retrieve conversations sorting by latest activity
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', '-password')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender receiver',
        select: '-password',
      },
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Conversations retrieved successfully',
    data: conversations,
  });
};

/**
 * @desc    Get conversation details by ID
 * @route   GET /api/conversations/:id
 * @access  Private
 */
export const getConversationById = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;

  // Locate the conversation only if the user is a participant
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  })
    .populate('participants', '-password')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender receiver',
        select: '-password',
      },
    })
    .lean();

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found or access denied');
  }

  res.status(200).json({
    success: true,
    message: 'Conversation details retrieved successfully',
    data: conversation,
  });
};
