import { useEffect, useCallback, useRef } from 'react';
import { useChatStore, Message } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { useSocketContext } from '@/components/providers/SocketProvider';

export function useMessages(conversationId: string | null) {
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage: deleteMessageFromStore,
    setLoading,
    setError,
    markAsRead,
    addTypingUser,
    removeTypingUser,
  } = useChatStore();

  const { currentUser } = useUserStore();
  const { socket, isConnected } = useSocketContext();
  const hasJoinedRoom = useRef(false);

  const currentMessages = conversationId ? messages[conversationId] || [] : [];

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/conversations/${conversationId}/messages`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(conversationId, data.messages || []);

      // Mark as read
      if (data.messages && data.messages.length > 0) {
        markAsRead(conversationId, currentUser.id);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUser, setMessages, setLoading, setError, markAsRead]);

  const sendMessage = useCallback(
    async (
      content: string,
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'STICKER' | 'VOICE' = 'TEXT',
      additionalData?: {
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        stickerId?: string;
        replyToId?: string;
      }
    ) => {
      if (!conversationId || !currentUser) {
        throw new Error('Conversation or user not found');
      }

      try {
        // Send via Socket.io if connected, otherwise use HTTP
        if (socket && isConnected) {
          socket.emit('message:send', {
            conversationId,
            senderId: currentUser.id,
            content,
            type,
            ...additionalData,
          });

          // Message will be added to store via socket event listener
          return;
        }

        // Fallback to HTTP if socket not available
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            type,
            ...additionalData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        addMessage(conversationId, data.message);
        return data.message;
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [conversationId, currentUser, addMessage, setError, socket, isConnected]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        const response = await fetch(`/api/messages/${messageId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete message');
        }

        deleteMessageFromStore(conversationId, messageId);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error deleting message:', error);
        throw error;
      }
    },
    [conversationId, deleteMessageFromStore, setError]
  );

  const updateMessageContent = useCallback(
    async (messageId: string, updates: { content?: string; isPinned?: boolean }) => {
      if (!conversationId) return;

      try {
        const response = await fetch(`/api/messages/${messageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update message');
        }

        const data = await response.json();
        updateMessage(conversationId, messageId, data.message);
        return data.message;
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error updating message:', error);
        throw error;
      }
    },
    [conversationId, updateMessage, setError]
  );

  // Fetch initial messages when conversation changes
  useEffect(() => {
    if (conversationId && currentUser) {
      fetchMessages();
    }
  }, [conversationId, currentUser, fetchMessages]);

  // Socket.io real-time message handling
  useEffect(() => {
    if (!socket || !isConnected || !conversationId || !currentUser) return;

    // Join conversation room only once
    if (!hasJoinedRoom.current) {
      socket.emit('conversation:join', conversationId);
      hasJoinedRoom.current = true;
    }

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId) {
        // Transform message to match store format
        const formattedMessage: Message = {
          ...message,
          sender: {
            ...message.sender,
            isOnline: message.sender.isOnline ?? true,
          },
          readReceipts: [],
          isDeleted: false,
          deletedFor: [],
          isPinned: false,
        };

        addMessage(conversationId, formattedMessage);

        // Mark as read if from someone else
        if (message.senderId !== currentUser.id) {
          socket.emit('message:read', {
            messageId: message.id,
            userId: currentUser.id,
            conversationId,
          });
          markAsRead(conversationId, currentUser.id);
        }
      }
    };

    const handleMessageRead = (data: {
      messageId: string;
      userId: string;
      readAt: Date | string;
    }) => {
      updateMessage(conversationId, data.messageId, {
        readReceipts: [
          {
            id: `${data.messageId}-${data.userId}`,
            userId: data.userId,
            readAt: data.readAt,
          },
        ],
      });
    };

    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      displayName: string;
    }) => {
      if (data.conversationId === conversationId && data.userId !== currentUser.id) {
        addTypingUser({
          userId: data.userId,
          userName: data.displayName,
          conversationId: data.conversationId,
        });
      }
    };

    const handleTypingStop = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId === conversationId) {
        removeTypingUser(data.userId, data.conversationId);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);

      // Leave conversation room
      socket.emit('conversation:leave', conversationId);
      hasJoinedRoom.current = false;
    };
  }, [socket, isConnected, conversationId, currentUser, addMessage, updateMessage, markAsRead, addTypingUser, removeTypingUser]);

  return {
    messages: currentMessages,
    fetchMessages,
    sendMessage,
    deleteMessage,
    updateMessage: updateMessageContent,
  };
}
