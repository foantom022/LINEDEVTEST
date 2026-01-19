'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface UseTypingOptions {
  conversationId: string;
  userId: string;
  displayName: string;
  socket: Socket | null;
  typingTimeout?: number; // milliseconds
}

interface UseTypingReturn {
  isTyping: boolean;
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
}

export function useTyping({
  conversationId,
  userId,
  displayName,
  socket,
  typingTimeout = 3000,
}: UseTypingOptions): UseTypingReturn {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingUsersTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startTyping = useCallback(() => {
    if (!socket?.connected) return;

    // Only emit if not already typing
    if (!isTyping) {
      socket.emit('typing:start', {
        conversationId,
        userId,
        displayName,
      });
      setIsTyping(true);
    }

    // Clear existing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Auto-stop typing after timeout
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [socket, conversationId, userId, displayName, isTyping, typingTimeout]);

  const stopTyping = useCallback(() => {
    if (!socket?.connected) return;

    if (isTyping) {
      socket.emit('typing:stop', {
        conversationId,
        userId,
      });
      setIsTyping(false);
    }

    // Clear timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [socket, conversationId, userId, isTyping]);

  useEffect(() => {
    if (!socket) return;

    // Handle incoming typing start events
    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      displayName: string;
    }) => {
      // Only show typing indicator for other users in the same conversation
      if (
        data.conversationId === conversationId &&
        data.userId !== userId
      ) {
        setTypingUsers((prev) => {
          // Check if user is already in the list
          if (prev.some((u) => u.userId === data.userId)) {
            return prev;
          }
          return [...prev, { userId: data.userId, displayName: data.displayName }];
        });

        // Clear existing timer for this user
        const existingTimer = typingUsersTimerRef.current.get(data.userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Auto-remove user after timeout
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
          typingUsersTimerRef.current.delete(data.userId);
        }, typingTimeout + 1000); // Slightly longer than the sender's timeout

        typingUsersTimerRef.current.set(data.userId, timer);
      }
    };

    // Handle incoming typing stop events
    const handleTypingStop = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (
        data.conversationId === conversationId &&
        data.userId !== userId
      ) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));

        // Clear timer for this user
        const existingTimer = typingUsersTimerRef.current.get(data.userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          typingUsersTimerRef.current.delete(data.userId);
        }
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);

      // Clear all timers
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      typingUsersTimerRef.current.forEach((timer) => {
        clearTimeout(timer);
      });
      typingUsersTimerRef.current.clear();
    };
  }, [socket, conversationId, userId, typingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return {
    isTyping,
    typingUsers,
    startTyping,
    stopTyping,
  };
}

// Helper function to format typing indicator text
export function formatTypingText(typingUsers: TypingUser[]): string {
  if (typingUsers.length === 0) return '';

  if (typingUsers.length === 1) {
    return `${typingUsers[0].displayName} is typing...`;
  }

  if (typingUsers.length === 2) {
    return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing...`;
  }

  return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing...`;
}
