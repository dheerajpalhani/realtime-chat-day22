import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { searchResults, searchUsers, clearSearchResults, createConversation, loading, onlineUsers } = useChatStore();

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      } else {
        clearSearchResults();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, searchUsers, clearSearchResults]);

  const handleStartChat = async (userId) => {
    try {
      await createConversation(userId);
      toast.success('Conversation started!');
      onClose();
      setQuery('');
      clearSearchResults();
    } catch (err) {
      toast.error(err.message || 'Failed to start conversation');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#090D1A]/80 backdrop-blur-sm"
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md p-6 rounded-2xl bg-[#1E293B] border border-white/5 shadow-2xl relative z-10 flex flex-col max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white tracking-wide">New Chat</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#334155] border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Search box input */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <FiSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A] text-white rounded-xl border border-white/5 focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-slate-600"
              autoFocus
            />
          </div>

          {/* Search results list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading && searchResults.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && query.trim() && searchResults.length === 0 && (
              <p className="text-center text-slate-500 py-6 text-sm">No users found matching query</p>
            )}

            {!query.trim() && (
              <p className="text-center text-slate-500 py-6 text-xs italic">Type to search for friends...</p>
            )}

            {searchResults.map((user) => {
              const isOnline = onlineUsers.includes(user._id.toString());
              return (
                <div
                  key={user._id}
                  onClick={() => handleStartChat(user._id)}
                  className="p-3 flex items-center justify-between rounded-xl hover:bg-[#0F172A]/40 border border-transparent hover:border-white/5 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {/* User profile picture */}
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Presence indicator */}
                      {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#1E293B]"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{user.name}</h4>
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    </div>
                  </div>

                  <button className="p-2 rounded-xl bg-[#2563EB]/10 text-[#38BDF8] group-hover:bg-[#2563EB] group-hover:text-white transition-all cursor-pointer">
                    <FiMessageSquare className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SearchModal;
