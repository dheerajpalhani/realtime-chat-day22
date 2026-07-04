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

---

## Directory Structure

```text
server/
│
├── src/
│   ├── config/
│   │      db.js                 # MongoDB connection using Mongoose
│   │
│   ├── controllers/             # Request handlers (Controllers)
│   │
│   ├── middleware/
│   │      authMiddleware.js     # JWT token validation middleware
│   │      errorMiddleware.js    # Global error & 404 handling middlewares
│   │
│   ├── models/
│   │      userModel.js          # Mongoose schema for User representation
│   │
│   ├── routes/                  # API routing
│   │
│   ├── services/                # Business logic services
│   │
│   ├── sockets/                 # Socket.IO handlers
│   │
│   ├── utils/                   # Shared utility methods
│   │
│   ├── validations/             # Request payload validations
│   │
│   ├── app.js                   # Express application initialization & middleware routing
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

- [Node.js](https://nodejs.org/) (v16+ recommended)
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
| `CLIENT_URL` | Frontend client origin URL (for CORS validation) | `http://localhost:3000` |

---

## API Endpoints

### Health Check

- **Endpoint**: `GET /`
- **Description**: Verifies that the API service is active.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Real-Time Chat API Running",
    "version": "1.0.0"
  }
  ```
