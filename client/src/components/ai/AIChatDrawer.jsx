import { useEffect, useRef } from 'react';
import { useAIStore } from '../../store/aiStore.js';
import AIMessageBubble from './AIMessageBubble.jsx';
import AIPromptInput from './AIPromptInput.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMessageSquare } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';

const AIChatDrawer = ({ isOpen, onClose }) => {
  const messagesEndRef = useRef(null);
  const {
    messages,
    loading,
    generating,
    fetchAIHistory,
    sendAIQuery,
    stopGeneration,
    regenerateAIResponse,
    suggestedPrompts,
  } = useAIStore();

  // Load history logs upon opening
  useEffect(() => {
    if (isOpen) {
      fetchAIHistory();
    }
  }, [isOpen, fetchAIHistory]);

  // Scroll to bottom on new stream chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendPrompt = (promptText) => {
    sendAIQuery(promptText);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#090D1A]/60 backdrop-blur-sm"
          />

          {/* Drawer Body Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-screen max-w-lg h-full bg-[#1E293B] border-l border-white/5 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#1E293B]/40 backdrop-blur-md">
              <div className="flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-blue-500/10 text-[#38BDF8] border border-blue-500/20 shadow-md">
                  <IoSparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">AI Coding Partner</h3>
                  <span className="text-[10px] text-slate-400">Gemini-powered developer support</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[#334155] border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation zone */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#090D1A]">
              {loading && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                /* Empty state / Suggested prompt listing */
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  <div className="p-4 rounded-full bg-blue-500/5 border border-white/5 mb-4 text-[#38BDF8]">
                    <IoSparkles className="w-10 h-10 animate-bounce" />
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">Meet ChatFlow AI</h4>
                  <p className="text-slate-400 text-xs max-w-xs leading-relaxed mb-6">
                    Ask coding questions, summarize chat history logs, or write documentation scripts. Select a prompt below to begin:
                  </p>

                  <div className="w-full flex flex-col gap-2 max-w-sm">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendPrompt(prompt)}
                        className="p-3 text-left rounded-xl bg-[#1E293B]/70 border border-white/5 hover:border-white/15 hover:bg-[#1E293B] text-xs font-medium text-slate-300 hover:text-white transition-all duration-200 cursor-pointer text-ellipsis truncate"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat logs */
                messages.map((msg, idx) => (
                  <AIMessageBubble
                    key={msg._id}
                    msg={msg}
                    isLast={idx === messages.length - 1}
                    onRegenerate={regenerateAIResponse}
                  />
                ))
              )}

              {/* Anchor target to keep scroll bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Prompts Composer */}
            <AIPromptInput
              generating={generating}
              onSend={handleSendPrompt}
              onStop={stopGeneration}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIChatDrawer;
