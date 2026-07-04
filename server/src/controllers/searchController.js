import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

/**
 * Execute global unified search across users, conversations, and messages.
 * @route   GET /api/search
 * @access  Private
 */
export const handleGlobalSearch = async (req, res) => {
  try {
    const query = req.query.query || '';
    const userId = req.user._id;

    if (!query.trim()) {
      return res.status(200).json({
        success: true,
        data: { users: [], conversations: [], messages: [] },
      });
    }

    const searchRegex = new RegExp(query, 'i');

    // 1. Search Users (excluding self)
    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
      ],
    })
      .select('-password')
      .limit(10)
      .lean();

    // 2. Search Conversations (where current user participates and recipient matches query)
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', '-password')
      .populate('lastMessage')
      .lean();

    const matchedConversations = conversations.filter((c) => {
      const recipient = c.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      if (!recipient) return false;
      return (
        recipient.name.match(searchRegex) ||
        recipient.username.match(searchRegex) ||
        c.lastMessageText?.match(searchRegex)
      );
    });

    // 3. Search Messages (where current user participates and message text matches)
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
      message: { $regex: searchRegex },
      isDeleted: false,
    })
      .populate('sender', '-password')
      .populate('receiver', '-password')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        users,
        conversations: matchedConversations.slice(0, 10),
        messages,
      },
    });
  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export default handleGlobalSearch;
