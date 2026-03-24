import { useEffect, useRef, useCallback } from 'react';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socketService';

/**
 * Custom hook for managing socket connections in React components
 * @param {string} token - JWT authentication token
 * @param {boolean} enabled - Whether to enable the socket connection (default: true)
 * @returns {Object} - Socket instance and connection state
 */
export const useSocket = (token, enabled = true) => {
  const socketRef = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !token) return;

    try {
      socketRef.current = initializeSocket(token);

      const handleConnected = () => {
        connectedRef.current = true;
        console.log('✅ Socket connected via hook');
      };

      const handleDisconnect = (reason) => {
        connectedRef.current = false;
        console.log('❌ Socket disconnected:', reason);
      };

      const handleError = (error) => {
        console.error('Socket error:', error);
      };

      socketRef.current.on('connected', handleConnected);
      socketRef.current.on('disconnect', handleDisconnect);
      socketRef.current.on('error', handleError);

      return () => {
        // Don't disconnect on unmount - keep socket alive for other components
        // but remove event listeners
        if (socketRef.current) {
          socketRef.current.off('connected', handleConnected);
          socketRef.current.off('disconnect', handleDisconnect);
          socketRef.current.off('error', handleError);
        }
      };
    } catch (error) {
      console.error('Failed to initialize socket in hook:', error);
    }
  }, [token, enabled]);

  const subscribe = useCallback((event, callback) => {
    const socket = getSocket();
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, []);

  const emit = useCallback((event, data) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: connectedRef.current,
    subscribe,
    emit,
  };
};

export default useSocket;
