import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { FiSend, FiSmile, FiImage, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const { activeConversation, sendMessage, startTyping, stopTyping } = useChatStore();
  const user = useAuthStore((state) => state.user);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const emojis = ['😀', '😂', '😍', '👍', '🔥', '🎉', '🚀', '❤️', '🤔', '😭', '👏', '🎁', '🌟', '🌈', '✅', '❌'];

  // Reset image preview on conversation change
  useEffect(() => {
    setImagePreview(null);
    setText('');
    setShowEmoji(false);
    
    // Stop typing if active room changed
    if (isTypingRef.current && activeConversation) {
      stopTyping(activeConversation._id);
      isTypingRef.current = false;
    }
  }, [activeConversation]);

  // Extract recipient details
  const recipient = activeConversation?.participants.find(
    (p) => p._id.toString() !== user?._id?.toString()
  );

  // Handle typing indicator trigger
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!activeConversation) return;

    // Start typing trigger
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      startTyping(activeConversation._id);
    }

    // Debounce typing-stop trigger after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && activeConversation) {
        stopTyping(activeConversation._id);
        isTypingRef.current = false;
      }
    }, 2000);
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Limit to 5MB images
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result); // Base64 string
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    const messageContent = text.trim();
    const type = imagePreview ? 'image' : 'text';
    const preview = imagePreview;

    // Clear inputs immediately for rapid visual response
    setText('');
    setImagePreview(null);
    setShowEmoji(false);

    // Stop typing emitter immediately
    if (isTypingRef.current && activeConversation) {
      clearTimeout(typingTimeoutRef.current);
      stopTyping(activeConversation._id);
      isTypingRef.current = false;
    }

    try {
      await sendMessage(
        activeConversation._id,
        recipient._id,
        messageContent || 'Sent an image attachment',
        type,
        preview
      );
    } catch (err) {
      toast.error('Failed to send message');
      // Restore text if failed
      setText(messageContent);
      setImagePreview(preview);
    }
  };

  return (
    <div className="p-4 bg-[#1E293B]/20 border-t border-white/5 relative">
      {/* Image Attachment Preview */}
      {imagePreview && (
        <div className="absolute bottom-full left-4 mb-2 p-2 rounded-xl bg-[#1E293B] border border-white/5 shadow-2xl flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black/10">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 hover:bg-black text-white transition-all cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 max-w-[120px] truncate">Image selected</p>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 p-3 rounded-xl bg-[#1E293B] border border-white/5 shadow-2xl grid grid-cols-4 gap-2 z-50">
          {emojis.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#334155] text-lg active:scale-95 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-3">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-3 rounded-xl hover:bg-[#334155] text-slate-400 hover:text-white border border-transparent hover:border-white/5 transition-all cursor-pointer ${
            showEmoji ? 'bg-[#334155] text-white' : ''
          }`}
          title="Emojis"
        >
          <FiSmile className="w-5 h-5" />
        </button>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl hover:bg-[#334155] text-slate-400 hover:text-white border border-transparent hover:border-white/5 transition-all cursor-pointer"
          title="Attach Image"
        >
          <FiImage className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={imagePreview ? 'Type caption or press send...' : 'Type a message...'}
          className="flex-1 px-4 py-3 text-sm bg-[#0F172A] text-white rounded-xl border border-white/5 focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all placeholder:text-slate-600"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="p-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#2563EB]/30 text-white font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
