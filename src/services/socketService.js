import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize socket connection with authentication
 * @param {string} token - JWT authentication token
 * @returns {Object} - Socket instance
 */
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  try {
    socket = io(window.location.origin, {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    console.log('🔌 Socket service initialized');
    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    throw error;
  }
};

/**
 * Get the current socket instance
 * @returns {Object|null} - Socket instance or null if not initialized
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected');
  }
};

/**
 * Check if socket is connected
 * @returns {boolean} - Connection status
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Listen to socket event
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
export const onSocketEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized');
    return;
  }
  socket.on(event, callback);
};

/**
 * Emit socket event
 * @param {string} event - Event name
 * @param {*} data - Data to emit
 */
export const emitSocketEvent = (event, data) => {
  if (!socket || !socket.connected) {
    console.warn('Socket not connected');
    return;
  }
  socket.emit(event, data);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  onSocketEvent,
  emitSocketEvent,
};
