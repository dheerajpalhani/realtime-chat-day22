import { create } from 'zustand';
import api from '../services/api.js';

export const useAIStore = create((set, get) => ({
  messages: [],
  loading: false,
  generating: false,
  conversationId: null,
  botId: null,
  abortController: null,
  suggestedPrompts: [
    'Explain React Hooks',
    'Write a SQL Query for finding duplicates',
    'Debug JavaScript async/await issues',
    'Generate REST API Documentation template',
    'Summarize JavaScript garbage collection',
  ],

  /**
   * Fetch the previous AI Conversation history.
   */
  fetchAIHistory: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/ai/history');
      set({
        messages: res.data.data,
        conversationId: res.data.conversationId,
        botId: res.data.botId,
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      console.error('Failed to load AI history:', err.message);
    }
  },

  /**
   * Stream prompt queries from Google Gemini API.
   * @param {string} prompt - User query prompt
   */
  sendAIQuery: async (prompt) => {
    if (!prompt.trim() || get().generating) return;

    // Create abort controller to support stopping generation
    const controller = new AbortController();
    set({ generating: true, abortController: controller });

    const tempUserId = 'user_' + Date.now();
    const tempBotId = 'bot_' + Date.now();

    // 1. Optimistically append the User's query and a blank Bot response placeholder
    const userMessage = {
      _id: tempUserId,
      message: prompt,
      sender: { _id: 'me', name: 'User' },
      createdAt: new Date().toISOString(),
    };

    const botPlaceholder = {
      _id: tempBotId,
      message: '',
      sender: { _id: get().botId || 'bot', name: 'ChatFlow AI' },
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, botPlaceholder],
    }));

    try {
      const token = localStorage.getItem('token');
      // Execute fetch with stream support using native reader
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: !done });

        // Parse Server-Sent Events chunks ('data: {...}')
        const lines = chunk.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataVal = trimmed.substring(6).trim();
            
            if (dataVal === '[DONE]') {
              done = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataVal);
              if (parsed.text) {
                accumulatedText += parsed.text;
                
                // Update bot placeholder with accumulated text stream chunks in real-time
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m._id === tempBotId ? { ...m, message: accumulatedText } : m
                  ),
                }));
              }
            } catch (err) {
              // Ignore boundary JSON split parse failures
            }
          }
        }
      }

      // Mark streaming finalized and replace placeholder ID with db results if history is refreshed
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempBotId ? { ...m, isStreaming: false } : m
        ),
      }));
      
      // Pull history from DB to sync correct ID mapping
      await get().fetchAIHistory();
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('AI generation aborted by user.');
        // Mark message finalized up to its current state
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempBotId ? { ...m, isStreaming: false, message: m.message + ' [Generation Stopped]' } : m
          ),
        }));
      } else {
        console.error('AI Query failed:', err.message);
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempBotId ? { ...m, isStreaming: false, message: 'Generation failed: ' + err.message } : m
          ),
        }));
      }
    } finally {
      set({ generating: false, abortController: null });
    }
  },

  /**
   * Stop current streaming generation.
   */
  stopGeneration: () => {
    const controller = get().abortController;
    if (controller) {
      controller.abort();
      set({ generating: false, abortController: null });
    }
  },

  /**
   * Regenerate the last AI reply in the history list.
   */
  regenerateAIResponse: async () => {
    const list = get().messages;
    if (list.length < 2) return;

    // Find the last model message and user message in history
    const lastMsg = list[list.length - 1];
    const prevMsg = list[list.length - 2];

    // Remove last model reply from store list and invoke query again
    set({
      messages: list.slice(0, -1),
    });

    await get().sendAIQuery(prevMsg.message);
  },
}));
export default useAIStore;
