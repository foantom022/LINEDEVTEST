'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  stickerId?: string;
  replyToId?: string;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    displayName: string;
    profileImage?: string;
    lineId: string;
  };
  replyTo?: any;
}

interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
  user: {
    id: string;
    displayName: string;
    profileImage?: string;
  };
}

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface TypingUser {
  conversationId: string;
  userId: string;
  displayName: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (data: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    stickerId?: string;
    replyToId?: string;
  }) => void;
  markMessageAsRead: (data: {
    messageId: string;
    userId: string;
    conversationId: string;
  }) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  onNewMessage: (callback: (message: Message) => void) => void;
  onMessageRead: (callback: (receipt: ReadReceipt) => void) => void;
  onUserOnline: (callback: (status: UserStatus) => void) => void;
  onUserOffline: (callback: (status: UserStatus) => void) => void;
  onTypingStart: (callback: (data: TypingUser) => void) => void;
  onTypingStop: (callback: (data: TypingUser) => void) => void;
}

export function useSocket(userId?: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socket',
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Register user with socket server
      socketInstance.emit('user:register', userId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
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
    });

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [userId]);

  const sendMessage = (data: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    stickerId?: string;
    replyToId?: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', data);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  };

  const markMessageAsRead = (data: {
    messageId: string;
    userId: string;
    conversationId: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:read', data);
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:join', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:leave', conversationId);
    }
  };

  const onNewMessage = (callback: (message: Message) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message:new', callback);
    }
  };

  const onMessageRead = (callback: (receipt: ReadReceipt) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message:read', callback);
    }
  };

  const onUserOnline = (callback: (status: UserStatus) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user:online', callback);
    }
  };

  const onUserOffline = (callback: (status: UserStatus) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user:offline', callback);
    }
  };

  const onTypingStart = (callback: (data: TypingUser) => void) => {
    if (socketRef.current) {
      socketRef.current.on('typing:start', callback);
    }
  };

  const onTypingStop = (callback: (data: TypingUser) => void) => {
    if (socketRef.current) {
      socketRef.current.on('typing:stop', callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    markMessageAsRead,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onMessageRead,
    onUserOnline,
    onUserOffline,
    onTypingStart,
    onTypingStop,
  };
}
