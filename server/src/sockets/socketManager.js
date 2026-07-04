import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import {
  addOnlineUser,
  removeOnlineUser,
  getSocketId,
  isUserOnline,
} from '../utils/onlineUsers.js';

/**
 * Socket.IO event and lifecycle manager.
 * Handles JWT handshake authentication, connection tracking, active rooms,
 * message relays, typing indicators, and read/delivery receipts.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
const socketManager = (io) => {
  // 1. Connection Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Look up user
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // 2. Event Connection Lifecycle
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    
    // Save to online users mapping
    addOnlineUser(userId, socket.id);

    // Update user status in database
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Broadcast user online status to all active clients
    socket.broadcast.emit('user-online', { userId });
    console.log(`Socket Connected: User ${socket.user.username} (${socket.id})`);

    // --- A. Join Conversation Room Event ---
    socket.on('join-conversation', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) {
          return callback?.({ success: false, message: 'Conversation ID is required' });
        }

        // Validate conversation exists and current user is a participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          return callback?.({ success: false, message: 'Conversation not found or access denied' });
        }

        // Leave other conversation rooms if desired, but standard join is sufficient
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
        callback?.({ success: true, message: `Joined room ${conversationId}` });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    // --- B. Send Message Event ---
    socket.on('send-message', async ({ conversationId, receiverId, message }, callback) => {
      try {
        if (!conversationId || !receiverId || !message) {
          return callback?.({ success: false, message: 'Missing conversationId, receiverId or message' });
        }

        // Verify conversation is valid and sender belongs to it
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) {
          return callback?.({ success: false, message: 'Conversation not found or access denied' });
        }

        // Determine if receiver is currently online
        const receiverOnline = isUserOnline(receiverId);
        const status = receiverOnline ? 'delivered' : 'sent';

        // Save message to MongoDB
        const newMessage = await Message.create({
          conversation: conversationId,
          sender: userId,
          receiver: receiverId,
          message,
          status,
        });

        // Update conversation lastMessage
        conversation.lastMessage = newMessage._id;
        conversation.lastMessageText = message;
        conversation.lastMessageAt = newMessage.createdAt;
        await conversation.save();

        // Populate sender & receiver profiles
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', '-password')
          .populate('receiver', '-password')
          .lean();

        // Relay the message: emit receive-message in the room
        io.to(conversationId).emit('receive-message', populatedMessage);

        // If recipient was online, update sender with message-delivered status
        if (receiverOnline) {
          io.to(conversationId).emit('message-delivered', {
            conversationId,
            messageId: newMessage._id,
            status: 'delivered',
          });
        }

        callback?.({ success: true, data: populatedMessage });
      } catch (err) {
        console.error(`Socket send-message error: ${err.message}`);
        callback?.({ success: false, message: err.message });
      }
    });

    // --- C. Typing Indicators ---
    socket.on('typing-start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('typing', {
          conversationId,
          senderId: userId,
        });
      }
    });

    socket.on('typing-stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('stop-typing', {
          conversationId,
          senderId: userId,
        });
      }
    });

    // --- D. Read Receipts (Mark as seen) ---
    socket.on('mark-as-seen', async ({ conversationId, messageIds }, callback) => {
      try {
        if (!conversationId || !Array.isArray(messageIds) || messageIds.length === 0) {
          return callback?.({ success: false, message: 'Invalid payload' });
        }

        // Update messages status to seen in DB
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversation: conversationId,
            receiver: userId, // Ensure current user is the one receiving/viewing the message
            status: { $ne: 'seen' },
          },
          { status: 'seen' }
        );

        // Broadcast to the conversation room that messages are read
        socket.to(conversationId).emit('messages-seen', {
          conversationId,
          messageIds,
        });

        callback?.({ success: true, message: 'Messages marked as seen' });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    // --- E. Disconnect lifecycle ---
    socket.on('disconnect', async () => {
      // Remove connection from online state
      removeOnlineUser(userId);

      // Update user state in database
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen,
      });

      // Broadcast user offline status to all active clients
      socket.broadcast.emit('user-offline', { userId, lastSeen });
      console.log(`Socket Disconnected: User ${socket.user.username} (${socket.id})`);
    });
  });
};

export default socketManager;
