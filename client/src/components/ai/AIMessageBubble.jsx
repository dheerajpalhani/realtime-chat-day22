import { useState } from 'react';
import { FiCopy, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore.js';
import toast from 'react-hot-toast';

const AIMessageBubble = ({ msg, isLast, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isMe = msg.sender?._id === 'me' || msg.sender?._id === user?._id;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(msg.message);
      setCopied(true);
      toast.success('Response copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const handleCopyCode = async (codeText) => {
    try {
      await navigator.clipboard.writeText(codeText);
      toast.success('Code copied!');
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  // Basic custom syntax highlighter for code block display
  const highlightCode = (code, lang) => {
    if (!code) return '';
    // Escape standard tags
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Color keywords
    const keywords = /\b(const|let|var|function|return|import|export|from|class|extends|if|else|for|while|async|await|try|catch|select|from|where|insert|into|update|delete|create|table|public|private|class)\b/g;
    escaped = escaped.replace(keywords, '<span class="text-pink-400 font-semibold">$1</span>');

    // Color comments
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="text-slate-500 italic">$1</span>');
    // Color strings
    escaped = escaped.replace(/(['"`])(.*?)\1/g, '<span class="text-emerald-400">"$2"</span>');
    // Color numbers
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

    return `<code class="font-mono text-xs block leading-relaxed">${escaped}</code>`;
  };

  // Simple, secure regex markdown parser to avoid external package weight
  const parseMarkdown = (text) => {
    if (!text) return '';

    // 1. Extract and format code blocks: ```lang ... ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }

      // Add code block details
      parts.push({
        type: 'code',
        lang: match[1] || 'javascript',
        code: match[2],
      });

      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <div key={idx} className="my-3 rounded-xl border border-white/10 bg-[#0B0F19] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0F172A] text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>{part.lang}</span>
              <button
                onClick={() => handleCopyCode(part.code)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <FiCopy /> Copy
              </button>
            </div>
            <pre
              className="p-4 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: highlightCode(part.code, part.lang) }}
            />
          </div>
        );
      }

      // Format standard inline nodes: **bold**, `code`, etc.
      let formattedText = part.content
        // Escape tags
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Inline code: `code`
        .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#0F172A] border border-white/5 font-mono text-xs text-amber-400">$1</code>')
        // Bullet lists
        .replace(/^\s*-\s+(.*)/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
        // Linebreaks
        .replace(/\n/g, '<br/>');

      return (
        <span
          key={idx}
          className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    });
  };

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={`relative max-w-[85%] px-4 py-3 rounded-2xl shadow-md border ${
          isMe
            ? 'bg-[#2563EB]/15 border-[#2563EB]/30 text-white rounded-br-none'
            : 'bg-[#1E293B]/70 border-white/5 text-slate-100 rounded-bl-none'
        }`}
      >
        {/* Header Sender Title */}
        <div className="flex items-center justify-between gap-8 mb-1 border-b border-white/5 pb-1">
          <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider">
            {isMe ? 'You' : 'ChatFlow AI'}
          </span>
          <span className="text-[9px] text-slate-500">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message body */}
        <div className="flex flex-col gap-1 pr-2">
          {parseMarkdown(msg.message)}
          {msg.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#38BDF8] animate-ping align-middle"></span>
          )}
        </div>

        {/* Bubble Toolbar */}
        {!isMe && !msg.isStreaming && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/5">
            {isLast && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                title="Regenerate Response"
              >
                <FiRefreshCw className="w-3 h-3" />
                <span>Regen</span>
              </button>
            )}
            
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px]"
              title="Copy response"
            >
              {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessageBubble;
