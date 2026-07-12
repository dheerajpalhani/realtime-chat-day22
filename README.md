# ChatFlow — Enterprise Real-Time Chat & AI Assistant Platform

ChatFlow is a production-ready, AI-powered real-time messaging application similar to WhatsApp, Slack, and Discord. It is built using the MERN Stack, Socket.IO, Zustand, and Tailwind CSS v4.

---

## Key Features

1. **Google Sign-In**: Secure authentication with Google Identity Services SDK, auto-registering first-time users.
2. **AI Coding Partner**: Google Gemini AI assistant with streaming SSE responses, markdown formatting, syntax highlighted code boxes, stop generation hooks, and copy buttons.
3. **Real-Time Communication**: Socket.IO client-server handshakes, online/offline presence indicators, typing tickers, and message delivery checks.
4. **Optimistic UI Update**: Rapid message rendering matching visual ticks, resolving temporary IDs dynamically once DB saves completed.
5. **Offline Resilience**: Queue and buffer outgoing events while offline, flushing them automatically upon socket reconnection.
6. **Rich Media Sharing**: Cloudinary direct streaming file loader (jpg, png, docs, audio notes) with Multer validations.
7. **Voice Notes Recorder**: Waveform CSS animations and MediaRecorder audio encoding, saving directly to Cloudinary storage.
8. **PWA Shell Caching**: Progressive Web App manifest configurations and service worker caching supporting offline asset loads.
9. **Refresh Token Rotation**: Triple-layer security using short access JWTs and rotated secure `refreshToken` HTTP-only cookies.
10. **Global Debounced Search**: 300ms debounced queries searching users, active chats, and text logs with match text highlights.
11. **Zustand Theme Engine**: Persisted Light/Dark theme settings synced with system settings.
12. **Light-Neon / Dark-Neon Theme Engine**: Custom dual-theme design system mapped to HSL/Hex CSS variable tokens for clean, high-contrast, modern neon branding.
13. **Auto-creating Guest / Demo User**: Integrated mock-free test session button creating `demo@chatflow.com` dynamically on the fly to preview features immediately.
14. **Mobile Native Responsiveness**: Dynamic screen transitions hiding sidebar during active chats on mobile viewports, including header back navigation.
15. **Strict Port Allocation**: Client locked strictly on port `5300` in `vite.config.js` to match production and local Google Identity Services callback scopes.

---

## Folder Structure

```text
day-22/
├── client/
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── sw.js               # Offline service worker
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/             # AIChatDrawer, AIMessageBubble, AIPromptInput
│   │   │   ├── chat/           # ChatHeader, MessageInput, MessageList, SearchModal, SearchPanel
│   │   │   └── layout/         # MainLayout, Navbar, Sidebar
│   │   ├── store/
│   │   │   ├── aiStore.js      # persistent state for AI bot interactions
│   │   │   ├── authStore.js    # authentication and user profile state
│   │   │   ├── chatStore.js    # active chats, socket events, and message buffers
│   │   │   └── themeStore.js   # persisted light/dark states
│   │   ├── socket/
│   │   │   └── socket.js       # Connection singleton with offline queue
│   │   ├── App.jsx
│   │   └── main.jsx
├── server/
│   ├── src/
│   │   ├── config/             # DB connection logic (db.js)
│   │   ├── controllers/        # auth, conversation, message, upload, ai, search controllers
│   │   ├── middleware/         # auth token validation, global error handling, file upload
│   │   ├── models/             # Conversation, Message, User models
│   │   ├── routes/             # API routing (auth, conversation, message, upload, ai, search)
│   │   ├── sockets/
│   │   │   └── socketManager.js # Socket handshake validation & message relaying
│   │   ├── utils/              # Online user tracking and helper utilities
│   │   ├── validations/        # Request payload validators
│   │   ├── app.js              # Express app setup and middleware registration
│   │   └── server.js           # Server entry point
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URL or local MongoDB instance
- Cloudinary Storage Account credentials (optional, fallback to memory base64 is active)
- Google Gemini API Key (optional, mock fallback mode is active)
- Google OAuth Client ID (from Google Cloud Console)

### Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the `.env` file matching:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatflow
   JWT_SECRET=your_jwt_access_secret_key_123
   CLIENT_URL=http://localhost:5300
   # Media Upload (Cloudinary) - Optional
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   # Gemini AI API Key - Optional
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Launch backend:
   - For **Development** (runs with nodemon/hot reloading):
     ```bash
     npm run dev
     ```
   - For **Production**:
     ```bash
     npm start
     ```

### Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the `.env` file matching:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_goes_here.apps.googleusercontent.com
   VITE_API_URL=http://localhost:5000/api
   ```
   > [!NOTE]
   > To obtain a `VITE_GOOGLE_CLIENT_ID`, create credentials in the Google Cloud Console (Web Application type). Ensure `http://localhost:5300` is added under **Authorized JavaScript Origins** and **Authorized Redirect URIs**, and list your testing email in the OAuth consent test users.
4. Launch frontend:
   ```bash
   npm run dev
   ```
5. Access client at `http://localhost:5300/`.

---

## API Documentation

### Auth Endpoints (`/api/auth`)
- `POST /register`: Register user account.
- `POST /login`: Generate access token and secure cookies.
- `POST /google`: Verify Google credential token and sign user in.
- `POST /refresh`: Rotate refresh token cookie, returning new access JWT.
- `POST /logout`: Destroy session cookies.
- `GET /me`: Get logged in user details.
- `GET /users`: Search accounts dynamically.

### Messages Endpoints (`/api/messages`)
- `POST /`: Send message inside chat.
- `GET /:conversationId`: Load paginated conversation messages list.
- `DELETE /:id`: Soft delete message.
- `PUT /:id`: Edit message body.
- `POST /:id/reaction`: Add/remove emoji reactions.
- `POST /:id/pin`: Toggle pin status.
- `POST /:id/star`: Toggle star status.

### Conversations Endpoints (`/api/conversations`)
- `POST /`: Create or retrieve a conversation with a specified user.
- `GET /`: Retrieve all active conversations for the authenticated user.
- `GET /:id`: Retrieve a specific conversation by ID.

### AI Endpoints (`/api/ai`)
- `POST /chat`: Stream query response from the AI assistant via Server-Sent Events (SSE).
- `GET /history`: Load conversational history with the AI assistant.

### Upload Endpoints (`/api/upload`)
- `POST /`: Upload a single media file (images, audio, or document attachments) to Cloudinary.

### Search Endpoints (`/api/search`)
- `GET /?query=...`: Execute unified debounced queries searching users, active conversations, and text logs.

---

## Socket Event Handlers

### Emitted from Client
- `join-conversation`: `{ conversationId }` — Joins active socket room.
- `send-message`: `{ conversationId, receiverId, message, messageType, image, file }` — Send message details.
- `typing-start`: `{ conversationId }` — Sends typing status alerts.
- `typing-stop`: `{ conversationId }` — Stops typing status alert.
- `mark-as-seen`: `{ conversationId, messageIds }` — Sends read seen indicators.

### Listened by Client
- `receive-message`: Receives message payload from socket room.
- `message-delivered`: Updates status ticks to delivered.
- `messages-seen`: Updates status ticks to read.
- `typing` / `stop-typing`: Displays/hides typing animation text in header.
- `user-online` / `user-offline`: Triggers presence dot modifications.

---

## Deployment Guidelines

### Frontend (Vercel)
1. Add `vercel.json` with rewrites pointing fallback paths to `/index.html`.
2. Configure Environment Variable:
   - `VITE_API_URL` pointing to backend Render URL.

### Backend (Render)
1. Configure Web Service build command: `npm install` and start command: `npm start`.
2. Configure all database, Cloudinary, and Gemini Environment variables.

---

## License
MIT
