// In-memory registry to map active user IDs to their respective socket IDs
const onlineUsers = new Map();

/**
 * Register a user as online.
 * @param {string} userId - ID of the user
 * @param {string} socketId - ID of the active Socket.IO connection
 */
export const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId.toString(), socketId);
};

/**
 * Unregister a user (mark offline).
 * @param {string} userId - ID of the user
 */
export const removeOnlineUser = (userId) => {
  onlineUsers.delete(userId.toString());
};

/**
 * Get the socket ID associated with an online user.
 * @param {string} userId - ID of the user
 * @returns {string|undefined} Socket ID or undefined if offline
 */
export const getSocketId = (userId) => {
  return onlineUsers.get(userId.toString());
};

/**
 * Check if a user is currently online.
 * @param {string} userId - ID of the user
 * @returns {boolean} True if online, false otherwise
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

/**
 * Retrieve a list of all online user IDs.
 * @returns {string[]} Array of user IDs
 */
export const getAllOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
