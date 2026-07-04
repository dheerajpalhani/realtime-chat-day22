import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import api from '../../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiMessageSquare, FiUser, FiMessageCircle } from 'react-icons/fi';

// Highlights matched text snippets dynamically
const HighlightText = ({ text, highlight }) => {
  if (!text) return null;
  if (!highlight.trim()) return <span>{text}</span>;
  
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

const SearchPanel = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], conversations: [], messages: [] });
  const [loading, setLoading] = useState(false);
  const { createConversation, setActiveConversation } = useChatStore();

  // Debounce logic executing searches after 300ms of typing inactivity
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], conversations: [], messages: [] });
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/search?query=${query}`);
        setResults(res.data.data);
      } catch (err) {
        console.error('Failed to search:', err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleStartChat = async (userId) => {
    try {
      await createConversation(userId);
      onClose();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 flex">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#090D1A]/60 backdrop-blur-sm"
          />

          {/* Slider Panel drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-screen max-w-sm h-full bg-[#1E293B] border-r border-white/5 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#1E293B]/40">
              <div className="flex items-center gap-2 text-white">
                <FiSearch className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="font-bold text-sm tracking-wide">Global Search</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[#334155] border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Input query field */}
            <div className="p-4 bg-[#0F172A]/40 border-b border-white/5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FiSearch className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search users, chats, messages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-[#0F172A] text-white rounded-xl border border-white/5 focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            {/* Results Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#090D1A]">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
                </div>
              ) : !query.trim() ? (
                <p className="text-center text-slate-500 py-10 text-xs italic">Type to search chat history...</p>
              ) : (
                <>
                  {/* Results: Users */}
                  {results.users.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Users</h4>
                      {results.users.map((u) => (
                        <div
                          key={u._id}
                          onClick={() => handleStartChat(u._id)}
                          className="p-2.5 rounded-xl hover:bg-[#1E293B]/40 border border-transparent hover:border-white/5 transition-all duration-200 cursor-pointer flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/25 text-[#38BDF8] flex items-center justify-center font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                              <HighlightText text={u.name} highlight={query} />
                            </p>
                            <p className="text-[10px] text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Results: Conversations */}
                  {results.conversations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Chats</h4>
                      {results.conversations.map((c) => (
                        <div
                          key={c._id}
                          onClick={() => handleSelectConversation(c)}
                          className="p-2.5 rounded-xl hover:bg-[#1E293B]/40 border border-transparent hover:border-white/5 transition-all duration-200 cursor-pointer flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/25 text-[#34D399] flex items-center justify-center font-bold text-sm">
                            <FiMessageCircle />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                              {c.participants.map((p) => p.name).join(', ')}
                            </p>
                            {c.lastMessageText && (
                              <p className="text-[10px] text-slate-400 truncate">
                                <HighlightText text={c.lastMessageText} highlight={query} />
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Results: Messages */}
                  {results.messages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Messages</h4>
                      {results.messages.map((m) => (
                        <div
                          key={m._id}
                          className="p-2.5 rounded-xl hover:bg-[#1E293B]/40 border border-transparent hover:border-white/5 transition-all duration-200 flex flex-col gap-1 cursor-pointer group"
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-semibold">{m.sender.name}</span>
                            <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-200 group-hover:text-white leading-relaxed">
                            <HighlightText text={m.message} highlight={query} />
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.users.length === 0 &&
                    results.conversations.length === 0 &&
                    results.messages.length === 0 && (
                      <p className="text-center text-slate-500 py-10 text-xs">No matches found</p>
                    )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchPanel;
