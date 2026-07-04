import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// Seed or retrieve the global virtual AI Assistant Bot User
const getOrCreateAIBotUser = async () => {
  let aiBot = await User.findOne({ username: 'aibot' });
  if (!aiBot) {
    aiBot = await User.create({
      name: 'ChatFlow AI Assistant',
      username: 'aibot',
      email: 'aibot@chatflow.com',
      password: 'ai_bot_dummy_password_hash_not_used_123',
      bio: 'Enterprise-grade Gemini-powered AI Agent.',
      avatar: 'https://cdn-icons-png.flaticon.com/512/2040/2040946.png',
      isOnline: true,
    });
  }
  return aiBot;
};

/**
 * Handle AI query and return streaming content via Server-Sent Events (SSE).
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const streamAIChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user._id;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const aiBot = await getOrCreateAIBotUser();

    // 1. Find or create the conversation with AI Bot
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, aiBot._id] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, aiBot._id],
      });
    }

    // 2. Fetch last 10 messages for context mapping
    const history = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    history.reverse();

    // 3. Format history for Google Gemini API contents structure
    const contents = [];
    
    // System Instruction setup
    contents.push({
      role: 'user',
      parts: [{ text: 'You are ChatFlow AI, a helpful, advanced, developer-focused programming assistant. Be concise, highly professional, and format code snippets in Markdown.' }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will act as ChatFlow AI, focusing on accurate, formatting-clean, and developer-centric responses.' }],
    });

    history.forEach((msg) => {
      const role = msg.sender.toString() === userId.toString() ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.message }],
      });
    });

    // Append new query
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    // 4. Save user message to database
    const userMessage = await Message.create({
      conversation: conversation._id,
      sender: userId,
      receiver: aiBot._id,
      message: prompt,
      status: 'seen',
    });

    // Notify client of the user's saved message
    conversation.lastMessage = userMessage._id;
    conversation.lastMessageText = prompt;
    conversation.lastMessageAt = userMessage.createdAt;
    await conversation.save();

    // Configure headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.warn('GEMINI_API_KEY environment variable not configured. Streaming mock response.');
      const mockReply = `Hello! This is a simulated response because **GEMINI_API_KEY** is not configured in the server's \`.env\` file.\n\n### You queried:\n> "${prompt}"\n\nTo enable production-grade AI support, please obtain a Google AI API key and add it to your server configuration.`;
      
      // Simulate delay for realistic typing feedback
      const words = mockReply.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      
      // Save AI Response to database
      const botMessage = await Message.create({
        conversation: conversation._id,
        sender: aiBot._id,
        receiver: userId,
        message: mockReply,
        status: 'seen',
      });
      conversation.lastMessage = botMessage._id;
      conversation.lastMessageText = mockReply;
      conversation.lastMessageAt = botMessage.createdAt;
      await conversation.save();

      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Call Gemini API Stream Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API call failed:', errText);
      res.write(`data: ${JSON.stringify({ text: 'Error calling AI Engine: ' + errText })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Gemini stream returns a chunked JSON format. We parse content blocks.
      // Often outputting chunks in standard line strings. Let's do robust regex checking.
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Strip streaming wrappers if present, extract the raw content text
        try {
          // Gemini returns JSON objects inside chunk outputs, sometimes wrapped in array parts
          let cleanLine = trimmed;
          if (cleanLine.startsWith(',') || cleanLine.startsWith('[')) cleanLine = cleanLine.substring(1);
          if (cleanLine.endsWith(']')) cleanLine = cleanLine.slice(0, -1);
          
          const parsed = JSON.parse(cleanLine);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (chunkText) {
            accumulatedText += chunkText;
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        } catch (e) {
          // Ignore incomplete JSON chunks on boundaries
        }
      }
    }

    // Save final AI reply to database
    if (accumulatedText.trim()) {
      const botMessage = await Message.create({
        conversation: conversation._id,
        sender: aiBot._id,
        receiver: userId,
        message: accumulatedText,
        status: 'seen',
      });
      conversation.lastMessage = botMessage._id;
      conversation.lastMessageText = accumulatedText;
      conversation.lastMessageAt = botMessage.createdAt;
      await conversation.save();
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.write(`data: ${JSON.stringify({ text: 'Server internal error occurred.' })}\n\n`);
    res.end();
  }
};

/**
 * Fetch the user's AI Conversation messages list.
 * @route   GET /api/ai/history
 * @access  Private
 */
export const getAIHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const aiBot = await getOrCreateAIBotUser();

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, aiBot._id] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, aiBot._id],
      });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', '-password')
      .populate('receiver', '-password')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: messages,
      conversationId: conversation._id,
      botId: aiBot._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
