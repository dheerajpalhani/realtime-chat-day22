# ChatFlow Client — Frontend Application

This is the production-ready frontend for ChatFlow, an AI-powered real-time messaging application similar to WhatsApp, Slack, and Discord. It is built using React, Vite, Tailwind CSS v4, Framer Motion, and Zustand.

## Features

- **Real-Time Client**: Powered by Socket.IO client for live chat room connection, presence dots, typing indicators, and delivery/read ticks.
- **AI Coding Partner**: Google Gemini AI assistant interface with streaming Server-Sent Events (SSE) responses, markdown styling, stop generation triggers, and syntax-highlighted code blocks.
- **Optimistic UI Updates**: Instantly displays messages before database confirmation, resolving temporary IDs on completion.
- **Offline Resilience Queue**: Enqueues outgoing events when offline and flushes them automatically upon network reconnection.
- **Modern Typography & Design**: Vibrant dark-mode interface powered by Tailwind CSS v4, custom CSS glassmorphism, and Framer Motion micro-animations.
- **Google Sign-In Integration**: Authentic login state synchronizing through Google OAuth and customized route guards.
- **Zustand Theme Engine**: Persisted theme preferences supporting custom user configurations.
- **PWA Asset Caching**: Manifest setups and Service Worker strategies for caching key application assets.

---

## Directory Structure

```text
client/
│
├── public/
│      manifest.json         # PWA Manifest settings
│      sw.js                 # Offline service worker cache definitions
│
├── src/
│   ├── assets/              # Static media and brand assets
│   ├── components/
│   │   ├── ai/              # AIChatDrawer, AIMessageBubble, AIPromptInput
│   │   ├── chat/            # ChatHeader, MessageInput, MessageList, SearchModal, SearchPanel
│   │   └── layout/          # MainLayout, Navbar, Sidebar
│   │
│   ├── hooks/               # Custom reusable React hooks
│   ├── pages/               # Routing page shells (Home, Login, Profile, Register, NotFound)
│   ├── routes/              # Routing structures and ProtectedRoute route guard
│   ├── services/            # Axios API config with interceptors
│   ├── socket/              # Connection singleton with offline queue (socket.js)
│   ├── store/               # Zustand global state stores (aiStore, authStore, chatStore, themeStore)
│   ├── index.css            # Custom styling and design variables
│   ├── App.jsx              # Main App entry routes mapping
│   └── main.jsx             # React DOM bootstrap entrypoint
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A running ChatFlow backend service instance.

### Installation

1. Navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file matching:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_goes_here.apps.googleusercontent.com
   VITE_API_URL=http://localhost:5000/api
   ```

### Execution

#### Run in development mode (with Vite dev server)
```bash
npm run dev
```

#### Build for production
```bash
npm run build
```

#### Preview production build locally
```bash
npm run preview
```
