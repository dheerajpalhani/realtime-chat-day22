import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { motion } from 'framer-motion';
import { IoCheckmark, IoCheckmarkDone } from 'react-icons/io5';
import { FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MessageList = () => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const { user } = useAuthStore();
  const { messages, activeConversation, fetchMessages, messagesPage, hasMoreMessages, deleteMessageLocally, loading } = useChatStore();
  const [deletingId, setDeletingId] = useState(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on conversation change or new messages
  useEffect(() => {
    if (messagesPage === 1) {
      scrollToBottom();
    }
  }, [messages, messagesPage]);

  // Handle paginated message fetching on scrolling to top
  const handleScroll = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && hasMoreMessages && !loading) {
      // Record current height to adjust scroll position after loading
      const prevScrollHeight = container.scrollHeight;
      
      await fetchMessages(activeConversation._id, messagesPage + 1);
      
      // Adjust scroll position to keep focus intact
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      }, 50);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setDeletingId(messageId);
    try {
      await deleteMessageLocally(messageId);
      toast.success('Message deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  // Format message time
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date headers (e.g. Today, Yesterday, or full date)
  const formatHeaderDate = (dateStr) => {
    const messageDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-6 bg-[#090D1A] space-y-4"
    >
      {/* Loading Spinner at the top of history during pagination */}
      {loading && messagesPage > 1 && (
        <div className="flex justify-center items-center py-2">
          <div className="w-5 h-5 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="h-full flex flex-col items-center justify-center text-slate-500">
          <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
        </div>
      )}

      {messages.map((msg, index) => {
        const isMe = msg.sender._id === user?._id;
        const showDateHeader = index === 0 || 
          new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

        return (
          <div key={msg._id} className="space-y-2">
            {/* Sticky/Dynamic Date Header */}
            {showDateHeader && (
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 bg-[#1E293B] border border-white/5 rounded-full uppercase">
                  {formatHeaderDate(msg.createdAt)}
                </span>
              </div>
            )}

            {/* Message Bubble flex layout container */}
            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl group flex flex-col gap-1 shadow-md ${
                  isMe 
                    ? 'chat-bubble-sent text-white' 
                    : 'chat-bubble-received text-slate-200'
                }`}
              >
                {/* Trash Icon for hover-over deletions (Only for Sender and if not already deleted) */}
                {isMe && !msg.isDeleted && (
                  <button
                    onClick={() => handleDeleteMessage(msg._id)}
                    disabled={deletingId === msg._id}
                    className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#1E293B]/80 text-red-400 opacity-0 group-hover:opacity-100 border border-white/5 transition-opacity hover:bg-[#334155] cursor-pointer"
                    title="Delete Message"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Deleted State Text */}
                {msg.isDeleted ? (
                  <p className="text-xs italic text-slate-400 flex items-center gap-1.5">
                    This message was deleted
                  </p>
                ) : (
                  <>
                    {/* Render Image Message */}
                    {msg.messageType === 'image' && msg.image && (
                      <div className="mb-1 rounded-xl overflow-hidden border border-white/5 bg-black/20 max-w-full">
                        <img
                          src={msg.image}
                          alt="Uploaded attachment"
                          className="max-h-60 w-auto object-cover hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Render text body */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                  </>
                )}

                {/* Timestamp and Receipt indicators */}
                <div className="flex items-center justify-end gap-1.5 self-end mt-0.5 select-none">
                  <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-500'}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                  
                  {isMe && !msg.isDeleted && (
                    <span className="flex items-center">
                      {msg.status === 'sent' && (
                        <IoCheckmark className="w-3.5 h-3.5 text-white/55" />
                      )}
                      {msg.status === 'delivered' && (
                        <IoCheckmarkDone className="w-3.5 h-3.5 text-white/55" />
                      )}
                      {msg.status === 'seen' && (
                        <IoCheckmarkDone className="w-3.5 h-3.5 text-[#38BDF8]" />
                      )}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        );
      })}

      {/* Invisible anchor target to force scroll view */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
