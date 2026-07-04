import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { FiArrowLeft, FiMoreVertical, FiUser } from 'react-icons/fi';

const ChatHeader = () => {
  const { activeConversation, setActiveConversation, typingUsers, onlineUsers } = useChatStore();
  const user = useAuthStore((state) => state.user);

  if (!activeConversation) return null;

  // Extract recipient details from participants list
  const recipient = activeConversation.participants.find(
    (p) => p._id.toString() !== user?._id?.toString()
  );

  if (!recipient) return null;

  const isOnline = onlineUsers.includes(recipient._id.toString()) || recipient.isOnline;
  const isTyping = typingUsers[activeConversation._id] === recipient._id.toString();

  // Formatting last seen date/time
  const formattedLastSeen = recipient.lastSeen
    ? new Date(recipient.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="px-6 py-3 flex items-center justify-between bg-[#1E293B]/40 border-b border-white/5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Back button on mobile view */}
        <button
          onClick={() => setActiveConversation(null)}
          className="md:hidden p-2 rounded-lg hover:bg-[#334155] border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>

        {/* Profile Avatar Frame */}
        <div className="relative">
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
          
          {/* Online Presence dot indicator */}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1E293B]" title="Online"></div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white tracking-wide">{recipient.name}</h4>
          
          {/* Real-time Status Text */}
          {isTyping ? (
            <span className="text-xs text-blue-400 font-semibold animate-pulse">typing...</span>
          ) : isOnline ? (
            <span className="text-xs text-emerald-400 font-medium">Online</span>
          ) : (
            <span className="text-xs text-slate-500">
              Offline {formattedLastSeen && `• Last seen ${formattedLastSeen}`}
            </span>
          )}
        </div>
      </div>

      {/* Right panel menu icons */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-all cursor-pointer">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
