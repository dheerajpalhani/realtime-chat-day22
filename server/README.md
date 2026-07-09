# Real-Time Chat Application with AI Bot (Backend Foundation)

This is the production-ready backend foundation for a scalable Real-Time Chat Application with AI Bot integrated using the MERN Stack. Built with Node.js, Express.js, and MongoDB, using ES Modules (`"type": "module"`).

## Features

- **ES Modules & Clean Architecture**: Modular folder structure facilitating separation of concerns.
- **Robust Security Stack**:
  - `helmet` for secure HTTP headers.
  - `cors` for cross-origin request policies.
  - `express-rate-limit` to prevent brute-force or DDoS attacks.
- **Robust Error Handling**:
  - Global centralized error middleware with auto-formatting of standard Mongoose validation/ObjectId errors.
  - Express asynchronous error handling without boilerplate try-catch blocks via `express-async-errors`.
  - 404 handler for invalid routes.
- **Authentication**: JWT token extraction from both cookies and authorization headers.
- **Logging**: Morgan HTTP logger integrated dynamically for development and production modes.
- **AI-Powered Chat Assistant**: Google Gemini API integration with Server-Sent Events (SSE) streaming support and local history storage.
- **Media Upload**: Direct file/media uploads to Cloudinary using Multer streams (supporting images, audio/voice notes, and document files).

---

## Directory Structure

```text
server/
│
├── src/
│   ├── config/
│   │      db.js                 # MongoDB connection using Mongoose
│   │
│   ├── controllers/             # Request handlers (auth, conversation, message, upload, ai, search)
│   │
│   ├── middleware/
│   │      authMiddleware.js     # JWT token validation middleware
│   │      errorMiddleware.js    # Global error & 404 handling middlewares
│   │      uploadMiddleware.js   # Multer file upload setup and filters
│   │
│   ├── models/
│   │      User.js               # Mongoose schema for User representation
│   │      Conversation.js       # Mongoose schema for Conversation room details
│   │      Message.js            # Mongoose schema for Message details
│   │
│   ├── routes/                  # API routing (auth, conversation, message, upload, ai, search)
│   │
│   ├── sockets/
│   │      socketManager.js      # Socket.IO connection events and lifecycle handlers
│   │
│   ├── utils/                   # Shared utility methods (onlineUsers tracking)
│   │
│   ├── validations/             # Request payload validations (message validation etc.)
│   │
│   ├── app.js                   # Express application initialization & middleware registration
│   │
│   └── server.js                # Database connection and HTTP server entrypoint
│
├── .env.example                 # Template for environment settings
├── .env                         # Server environment configuration
├── .gitignore                   # Files excluded from git tracking
├── package.json                 # Project manifest and scripts
└── README.md                    # Setup and project documentation
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas instance)

### Installation

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file (copied from `.env.example` or edited to match your local setup):
   ```bash
   cp .env.example .env
   ```

### Execution

#### Run in development mode (with Hot Reloading / Nodemon)
```bash
npm run dev
```

#### Run in production mode
```bash
npm start
```

---

## Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | The port the HTTP server listens on | `5000` |
| `NODE_ENV` | Mode of operation (`development` or `production`) | `development` |
| `MONGODB_URI` | Connection string for MongoDB database | `mongodb://127.0.0.1:27017/chat-app-db` |
| `JWT_SECRET` | Secret string for signing JWT tokens | `super_secret_jwt_signing_key_12345` |
| `CLIENT_URL` | Frontend client origin URL (for CORS validation) | `http://localhost:5300` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Storage cloud name | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret key | `your_cloudinary_api_secret` |
| `GEMINI_API_KEY` | Google Gemini AI Key | `your_gemini_api_key` |

---

## API Endpoints

### Health Check
- `GET /` — Verifies that the API service is active.

### Auth Endpoints (`/api/auth`)
- `POST /register` — Register user account.
- `POST /login` — Generate access token and secure cookies.
- `POST /google` — Verify Google credential token and sign user in.
- `POST /refresh` — Rotate refresh token cookie, returning new access JWT.
- `POST /logout` — Destroy session cookies.
- `GET /me` — Get logged in user details.
- `GET /users` — Search accounts dynamically.

### Messages Endpoints (`/api/messages`)
- `POST /` — Send message inside chat.
- `GET /:conversationId` — Load paginated conversation messages list.
- `DELETE /:id` — Soft delete message.
- `PUT /:id` — Edit message body.
- `POST /:id/reaction` — Add/remove emoji reactions.
- `POST /:id/pin` — Toggle pin status.
- `POST /:id/star` — Toggle star status.

### Conversations Endpoints (`/api/conversations`)
- `POST /` — Create or retrieve a conversation with a specified user.
- `GET /` — Retrieve all active conversations for the authenticated user.
- `GET /:id` — Retrieve a specific conversation by ID.

### AI Endpoints (`/api/ai`)
- `POST /chat` — Stream query response from the AI assistant via Server-Sent Events (SSE).
- `GET /history` — Load conversational history with the AI assistant.

### Upload Endpoints (`/api/upload`)
- `POST /` — Upload a single media file (images, audio, or document attachments) to Cloudinary.

### Search Endpoints (`/api/search`)
- `GET /` — Execute unified debounced queries searching users, active conversations, and text logs.
