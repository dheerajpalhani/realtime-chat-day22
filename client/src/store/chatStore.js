import { create } from 'zustand';
import api from '../services/api.js';
import { useAuthStore } from './authStore.js';
import { connectSocket, disconnectSocket, emitEventWithQueue } from '../socket/socket.js';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  typingUsers: {}, // maps conversationId -> userId
  unreadCounts: {}, // maps conversationId -> unreadCount
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  searchResults: [],
  hasMoreMessages: true,
  messagesPage: 1,

  /**
   * Connect to Socket.IO and register global event handlers.
   * @param {string} token - JWT authentication token
   */
  connectSocket: (token) => {
    if (get().socket) return;

    // Connect using singleton client
    const socketInstance = connectSocket(token, (socket) => {
      // Auto-join conversation room if active conversation is selected
      const active = get().activeConversation;
      if (active) {
        socket.emit('join-conversation', { conversationId: active._id }, (res) => {
          if (res?.success) {
            console.log('Auto-joined active conversation room on socket connect:', active._id);
          }
        });
      }
    });

    set({ socket: socketInstance });

    // Establish event listeners
    socketInstance.on('receive-message', (message) => {
      get().receiveMessage(message);
    });

    socketInstance.on('user-online', ({ userId }) => {
      set((state) => ({
        onlineUsers: [...new Set([...state.onlineUsers, userId])],
      }));
      // Mark matching participant online in conversations list
      set((state) => ({
        conversations: state.conversations.map((c) => {
          const updatedParticipants = c.participants.map((p) => {
            if (p._id === userId) {
              return { ...p, isOnline: true };
            }
            return p;
          });
          return { ...c, participants: updatedParticipants };
        }),
      }));
    });

    socketInstance.on('user-offline', ({ userId, lastSeen }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((id) => id !== userId),
      }));
      // Mark matching participant offline in conversations list
      set((state) => ({
        conversations: state.conversations.map((c) => {
          const updatedParticipants = c.participants.map((p) => {
            if (p._id === userId) {
              return { ...p, isOnline: false, lastSeen };
            }
            return p;
          });
          return { ...c, participants: updatedParticipants };
        }),
      }));
    });

    socketInstance.on('typing', ({ conversationId, senderId }) => {
      set((state) => {
        const activeTyping = { ...state.typingUsers };
        activeTyping[conversationId] = senderId;
        return { typingUsers: activeTyping };
      });
    });

    socketInstance.on('stop-typing', ({ conversationId, senderId }) => {
      set((state) => {
        const activeTyping = { ...state.typingUsers };
        delete activeTyping[conversationId];
        return { typingUsers: activeTyping };
      });
    });

    socketInstance.on('messages-seen', ({ conversationId, messageIds }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (messageIds.includes(m._id)) {
            return { ...m, status: 'seen' };
          }
          return m;
        }),
      }));
    });

    socketInstance.on('message-delivered', ({ conversationId, messageId }) => {
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m._id === messageId || m.tempId === messageId) {
            return { ...m, status: 'delivered' };
          }
          return m;
        }),
      }));
    });
  },

  /**
   * Terminate active Socket.IO connection and clear variables.
   */
  disconnectSocket: () => {
    disconnectSocket();
    set({ socket: null, onlineUsers: [], typingUsers: {} });
  },

  /**
   * Fetch active conversations list.
   */
  fetchConversations: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/conversations');
      const conversations = res.data.data;
      
      // Calculate initial unread counts dynamically
      const unreadCounts = {};
      const currentUserId = useAuthStore.getState().user?._id;
      
      conversations.forEach((c) => {
        if (
          c.lastMessage && 
          c.lastMessage.sender !== currentUserId && 
          c.lastMessage.status !== 'seen'
        ) {
          unreadCounts[c._id] = 1;
        } else {
          unreadCounts[c._id] = 0;
        }
      });

      set({ conversations, unreadCounts, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error('Failed to fetch conversations:', err.message);
    }
  },

  /**
   * Fetch conversation history.
   */
  fetchMessages: async (conversationId, page = 1) => {
    set({ loading: true });
    try {
      const res = await api.get(`/messages/${conversationId}?page=${page}&limit=30`);
      const newMessages = res.data.data;
      
      set((state) => {
        const mergedMessages = page === 1 
          ? newMessages 
          : [...newMessages, ...state.messages];
        
        return {
          messages: mergedMessages,
          messagesPage: page,
          hasMoreMessages: newMessages.length === 30,
          loading: false,
        };
      });
    } catch (err) {
      set({ loading: false });
      console.error('Failed to fetch messages:', err.message);
    }
  },

  /**
   * Select and join a conversation workspace.
   */
  setActiveConversation: (conversation) => {
    set({ 
      activeConversation: conversation, 
      messages: [], 
      messagesPage: 1, 
      hasMoreMessages: true 
    });

    if (conversation) {
      // Reset local unread mapping for this conversation room
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [conversation._id]: 0,
        },
      }));

      // Join conversation room on the socket
      const socket = get().socket;
      if (socket) {
        socket.emit('join-conversation', { conversationId: conversation._id }, (res) => {
          if (res?.success) {
            console.log('Joined conversation room:', conversation._id);
          }
        });
      }

      // Fetch messages history, then mark existing messages seen
      get().fetchMessages(conversation._id, 1).then(() => {
        get().markAsSeen(conversation._id);
      });
    }
  },

  /**
   * Optimistically add and send a chat message.
   */
  sendMessage: async (conversationId, receiverId, messageText, messageType = 'text', mediaUrl = '') => {
    const tempId = 'temp_' + Date.now();
    const currentUserId = useAuthStore.getState().user?._id;

    const tempMessage = {
      _id: tempId,
      tempId: tempId,
      conversation: conversationId,
      sender: { _id: currentUserId },
      receiver: { _id: receiverId },
      message: messageText,
      messageType,
      image: messageType === 'image' ? mediaUrl : '',
      file: messageType === 'file' ? mediaUrl : '',
      status: 'sent',
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    // 1. Append optimistically to UI
    set((state) => ({
      messages: [...state.messages, tempMessage],
    }));

    // 2. Prepend list in sidebar
    set((state) => {
      const updatedConvs = state.conversations.map((c) => {
        if (c._id === conversationId) {
          return {
            ...c,
            lastMessage: tempMessage,
            lastMessageText: messageText,
            lastMessageAt: tempMessage.createdAt,
          };
        }
        return c;
      });
      updatedConvs.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
      return { conversations: updatedConvs };
    });

    // 3. Emit payload via connection manager supporting offline queue buffers
    emitEventWithQueue(
      'send-message',
      {
        conversationId,
        receiverId,
        message: messageText,
        messageType,
        image: messageType === 'image' ? mediaUrl : '',
        file: messageType === 'file' ? mediaUrl : '',
      },
      (res) => {
        if (res?.success) {
          // Replace temporary message mapping with database values
          const savedMessage = res.data;
          set((state) => ({
            messages: state.messages.map((m) => (m._id === tempId ? savedMessage : m)),
          }));
          
          set((state) => ({
            conversations: state.conversations.map((c) => {
              if (c._id === conversationId) {
                return {
                  ...c,
                  lastMessage: savedMessage,
                  lastMessageText: savedMessage.message,
                  lastMessageAt: savedMessage.createdAt,
                };
              }
              return c;
            }),
          }));
        } else {
          console.error('Failed to send message:', res?.message);
          // Mark as failed in UI
          set((state) => ({
            messages: state.messages.map((m) => {
              if (m._id === tempId) {
                return { ...m, isFailed: true, isPending: false };
              }
              return m;
            }),
          }));
        }
      }
    );
  },

  /**
   * Handle incoming messages received via socket.
   */
  receiveMessage: (message) => {
    const active = get().activeConversation;

    if (active && active._id === message.conversation) {
      set((state) => {
        const exists = state.messages.some((m) => m._id === message._id);
        return {
          messages: exists ? state.messages : [...state.messages, message],
        };
      });

      // Send read receipt if active
      const socket = get().socket;
      if (socket && message.sender._id !== useAuthStore.getState().user?._id) {
        socket.emit('mark-as-seen', {
          conversationId: active._id,
          messageIds: [message._id],
        });
      }
    } else {
      // Increment unread count mapping
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [message.conversation]: (state.unreadCounts[message.conversation] || 0) + 1,
        },
      }));

      // Render alert toast
      toast(`${message.sender.name}: ${message.message}`, {
        icon: '💬',
        duration: 4000,
      });
    }

    // Refresh conversation list preview
    set((state) => {
      let isNewConv = true;
      const updatedConvs = state.conversations.map((c) => {
        if (c._id === message.conversation) {
          isNewConv = false;
          return {
            ...c,
            lastMessage: message,
            lastMessageText: message.message,
            lastMessageAt: message.createdAt,
          };
        }
        return c;
      });

      if (isNewConv) {
        get().fetchConversations();
      } else {
        updatedConvs.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
        return { conversations: updatedConvs };
      }
      return {};
    });
  },

  /**
   * Send read receipts to socket room.
   */
  markAsSeen: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0,
      },
    }));

    const currentUserId = useAuthStore.getState().user?._id;
    const unreadMessageIds = get()
      .messages.filter((m) => m.sender._id !== currentUserId && m.status !== 'seen')
      .map((m) => m._id);

    const socket = get().socket;
    if (socket && unreadMessageIds.length > 0) {
      socket.emit('mark-as-seen', {
        conversationId,
        messageIds: unreadMessageIds,
      });
    }
  },

  /**
   * Emit start typing event.
   */
  startTyping: (conversationId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('typing-start', { conversationId });
    }
  },

  /**
   * Emit stop typing event.
   */
  stopTyping: (conversationId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('typing-stop', { conversationId });
    }
  },

  /**
   * Start a conversation with another user.
   */
  createConversation: async (receiverId) => {
    set({ loading: true });
    try {
      const res = await api.post('/conversations', { receiverId });
      const conversation = res.data.data;
      
      set((state) => {
        const exists = state.conversations.some((c) => c._id === conversation._id);
        const updatedConvs = exists ? state.conversations : [conversation, ...state.conversations];
        return {
          conversations: updatedConvs,
          activeConversation: conversation,
          loading: false,
        };
      });
      
      get().fetchMessages(conversation._id, 1);
      return conversation;
    } catch (err) {
      set({ loading: false });
      console.error('Failed to start conversation:', err.message);
      throw err;
    }
  },

  /**
   * Search available database accounts.
   */
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ loading: true });
    try {
      const res = await api.get(`/auth/users?search=${query}`);
      set({ searchResults: res.data.data, loading: false });
    } catch (err) {
      set({ loading: false });
      console.error('Failed to search users:', err.message);
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  /**
   * Soft-delete a message locally.
   */
  deleteMessageLocally: async (messageId) => {
    try {
      const res = await api.delete(`/messages/${messageId}`);
      const updatedMessage = res.data.data;
      
      set((state) => ({
        messages: state.messages.map((m) => m._id === messageId ? updatedMessage : m),
      }));
      return updatedMessage;
    } catch (err) {
      console.error('Failed to delete message:', err.message);
      throw err;
    }
  },
}));
export default useChatStore;
