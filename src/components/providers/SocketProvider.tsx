'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function SocketProvider({ children, userId }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      // If no user, disconnect any existing socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socket',
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Register user with socket server
      socketInstance.emit('user:register', userId);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      // Re-register user after reconnection
      socketInstance.emit('user:register', userId);
      setIsConnected(true);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });

    // Cleanup on unmount or userId change
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
