import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import socketManager from './sockets/socketManager.js';

const PORT = process.env.PORT || 5000;

// Wrap Express app in standard HTTP Server
const httpServer = http.createServer(app);

// Initialize Socket.IO instance
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5300',
    credentials: true,
  },
});

// Expose Socket.IO to Express via settings (avoids circular dependency)
app.set('io', io);

// Initialize socket manager events
socketManager(io);

// Start Express Server
const server = httpServer.listen(PORT, async () => {
  console.log(`Server Running on port ${PORT}`);
  
  // Connect to MongoDB
  await connectDB();
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
