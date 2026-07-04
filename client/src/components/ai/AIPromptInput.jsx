import { useState, useRef, useEffect } from 'react';
import { FiSend, FiSquare } from 'react-icons/fi';

const AIPromptInput = ({ generating, onSend, onStop }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || generating) return;

    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize input text area height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [text]);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-[#1E293B]/20 relative">
      <div className="flex items-end gap-3 bg-[#0F172A] rounded-xl border border-white/5 p-2 focus-within:border-[#2563EB]/50 focus-within:ring-1 focus-within:ring-[#2563EB]/30 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything... (Shift+Enter for new line)"
          className="flex-1 max-h-32 px-3 py-1.5 text-sm bg-transparent text-white resize-none focus:outline-none placeholder:text-slate-600 font-sans"
        />

        {generating ? (
          <button
            type="button"
            onClick={onStop}
            className="p-3 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-red-500/5"
            title="Stop Generation"
          >
            <FiSquare className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#2563EB]/30 text-white font-bold transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
            title="Send Query"
          >
            <FiSend className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
};

export default AIPromptInput;
