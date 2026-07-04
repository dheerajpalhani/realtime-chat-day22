import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import SearchModal from '../chat/SearchModal.jsx';
import { FiSearch, FiEdit3, FiMessageSquare } from 'react-icons/fi';

const Sidebar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  
  const { 
    conversations, 
    fetchConversations, 
    activeConversation, 
    setActiveConversation, 
    typingUsers,
    onlineUsers,
    unreadCounts
  } = useChatStore();
  const user = useAuthStore((state) => state.user);

  // Initial fetch of active conversations on load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Format sent date
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter conversations locally based on search bar query
  const filteredConversations = conversations.filter((conv) => {
    const recipient = conv.participants.find(
      (p) => p._id.toString() !== user?._id?.toString()
    );
    if (!recipient) return false;
    return (
      recipient.name.toLowerCase().includes(localQuery.toLowerCase()) ||
      recipient.username.toLowerCase().includes(localQuery.toLowerCase())
    );
  });

  return (
    <aside className="w-full md:w-80 h-full flex flex-col bg-[#0F172A] border-r border-white/5 select-none">
      {/* Header Panel */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-xl font-bold text-white tracking-wide">Chats</h2>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md shadow-black/10"
          title="New Chat"
        >
          <FiEdit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Local Filter input */}
      <div className="p-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search chats..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#1E293B] text-white rounded-xl border border-white/5 focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Dynamic conversation list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-slate-500 py-8 flex flex-col items-center gap-2">
            <FiMessageSquare className="w-8 h-8 opacity-45" />
            <p className="text-xs">No active chats found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const recipient = conv.participants.find(
              (p) => p._id.toString() !== user?._id?.toString()
            );
            if (!recipient) return null;

            const isSelected = activeConversation?._id === conv._id;
            const isOnline = onlineUsers.includes(recipient._id.toString()) || recipient.isOnline;
            const isTyping = typingUsers[conv._id] === recipient._id.toString();

            return (
              <div
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`p-3 flex items-center gap-3 rounded-xl border transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? 'bg-[#2563EB]/10 border-[#2563EB]/25 text-white'
                    : 'hover:bg-[#1E293B]/40 border-transparent hover:border-white/5'
                }`}
              >
                {/* Avatar Frame */}
                <div className="relative flex-shrink-0">
                  {recipient.avatar ? (
                    <img
                      src={recipient.avatar}
                      alt={recipient.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center font-bold">
                      {recipient.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Presence indicator dot */}
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0F172A]"></div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold truncate ${
                      isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {recipient.name}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-blue-300' : 'text-slate-500'}`}>
                      {formatTime(conv.lastMessageAt || conv.updatedAt)}
                    </span>
                  </div>

                  {/* Real-time Subtitles */}
                  <div className="flex items-center justify-between mt-1">
                    {isTyping ? (
                      <p className="text-xs text-blue-400 font-medium animate-pulse">typing...</p>
                    ) : (
                      <p className={`text-xs truncate max-w-[80%] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {conv.lastMessageText || 'No messages yet'}
                      </p>
                    )}

                    {unreadCounts[conv._id] > 0 && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
                        {unreadCounts[conv._id]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal overlays */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </aside>
  );
};

export default Sidebar;
