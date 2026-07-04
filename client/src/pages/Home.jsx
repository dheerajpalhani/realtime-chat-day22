import { useChatStore } from '../store/chatStore.js';
import ChatHeader from '../components/chat/ChatHeader.jsx';
import MessageList from '../components/chat/MessageList.jsx';
import MessageInput from '../components/chat/MessageInput.jsx';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiShield, FiZap, FiCheckCircle } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore.js';

const Home = () => {
  const { activeConversation } = useChatStore();
  const { user } = useAuthStore();

  // If a chat session is active, render the workspace
  if (activeConversation) {
    return (
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#090D1A]">
        <ChatHeader />
        <MessageList />
        <MessageInput />
      </div>
    );
  }

  // Welcome panel placeholder if no conversation is active
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-[#090D1A] text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-[#38BDF8] flex items-center justify-center border border-blue-500/20 shadow-xl mb-6 animate-pulse">
          <FiMessageSquare className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-wide mb-2">
          Welcome back, <span className="text-[#38BDF8]">{user?.name}</span>!
        </h1>
        
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Select a chat from the sidebar or click the compose icon to start a real-time conversation.
        </p>

        {/* Feature Grid Placeholders */}
        <div className="w-full grid grid-cols-1 gap-4 text-left">
          
          <div className="p-4 rounded-2xl bg-[#1E293B]/50 border border-white/5 flex items-start gap-4 hover:border-white/10 transition-all duration-200">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FiZap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Real-Time Messaging</h3>
              <p className="text-xs text-slate-400 mt-1">Instant delivery states, typing indicators, and read receipts.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1E293B]/50 border border-white/5 flex items-start gap-4 hover:border-white/10 transition-all duration-200">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FiShield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Secure Session Guard</h3>
              <p className="text-xs text-slate-400 mt-1">Protected sessions verified with JWT token handshakes.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1E293B]/50 border border-white/5 flex items-start gap-4 hover:border-white/10 transition-all duration-200">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FiCheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Embedded Media Uploads</h3>
              <p className="text-xs text-slate-400 mt-1">Send text messages alongside rich images and attachments.</p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Home;
