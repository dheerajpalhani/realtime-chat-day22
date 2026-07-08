import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.endsWith('/api')) {
    return apiUrl.substring(0, apiUrl.length - 4);
  }
  return apiUrl || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

let socket = null;
let offlineQueue = [];

/**
 * Retrieve the active Socket.IO instance.
 * @returns {Object|null}
 */
export const getSocket = () => socket;

/**
 * Instantiate and establish Socket.IO connection.
 * @param {string} token - JWT authentication token
 * @param {Function} [onConnectCallback] - Callback fired on connection setup
 * @returns {Object} Socket instance
 */
export const connectSocket = (token, onConnectCallback) => {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'], // Restrict to pure Websockets for performance
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection success handler
  socket.on('connect', () => {
    console.log('Socket connected successfully:', socket.id);
    
    // Flush queued messages when network connection is recovered
    if (offlineQueue.length > 0) {
      console.log(`Socket connection recovered. Flushing ${offlineQueue.length} queued events...`);
      offlineQueue.forEach(({ event, data, callback }) => {
        socket.emit(event, data, callback);
      });
      offlineQueue = [];
    }

    if (onConnectCallback) {
      onConnectCallback(socket);
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected. Reason:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

/**
 * Close and destroy active Socket.IO connection.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit socket event immediately if connected, or queue it for transmission upon reconnection.
 * @param {string} event - Socket event name
 * @param {Object} data - Payload content
 * @param {Function} [callback] - Ack response handler
 */
export const emitEventWithQueue = (event, data, callback) => {
  if (socket && socket.connected) {
    socket.emit(event, data, callback);
  } else {
    console.warn(`Socket client is offline. Queueing event "${event}"...`);
    offlineQueue.push({ event, data, callback });
  }
};
