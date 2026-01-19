'use client';

import { useEffect, useRef } from 'react';
import { Message, useChatStore } from '@/store/chatStore';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Loader2 } from 'lucide-react';
import { useSocketContext } from '@/components/providers/SocketProvider';

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  isLoading?: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageList({
  conversationId,
  currentUserId,
  isLoading,
  onDeleteMessage,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocketContext();

  // Get messages and typing users from Zustand store
  const messages = useChatStore((state) => state.messages[conversationId] || []);
  const typingUsers = useChatStore((state) =>
    state.typingUsers.filter((u) => u.conversationId === conversationId)
  );
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const addTypingUser = useChatStore((state) => state.addTypingUser);
  const removeTypingUser = useChatStore((state) => state.removeTypingUser);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle new messages from Socket.io
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId) {
        // Transform the message to match our store format
        const formattedMessage: Message = {
          ...message,
          sender: {
            ...message.sender,
            isOnline: true,
          },
          readReceipts: [],
          isDeleted: false,
          deletedFor: [],
          isPinned: false,
        };

        addMessage(conversationId, formattedMessage);

        // Auto-scroll to bottom
        setTimeout(scrollToBottom, 100);

        // Mark message as read if sent by someone else
        if (message.senderId !== currentUserId) {
          socket.emit('message:read', {
            messageId: message.id,
            userId: currentUserId,
            conversationId,
          });
        }
      }
    };

    const handleMessageRead = (data: {
      messageId: string;
      userId: string;
      readAt: Date | string;
      user: any;
    }) => {
      // Update the message with read receipt
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
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
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

    // Join conversation room
    socket.emit('conversation:join', conversationId);

    // Mark existing messages as read
    messages.forEach((message) => {
      if (message.senderId !== currentUserId) {
        socket.emit('message:read', {
          messageId: message.id,
          userId: currentUserId,
          conversationId,
        });
      }
    });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.emit('conversation:leave', conversationId);
    };
  }, [socket, isConnected, conversationId, currentUserId, addMessage, updateMessage, addTypingUser, removeTypingUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const shouldShowAvatar = (index: number) => {
    if (index === messages.length - 1) return true;
    const currentMsg = messages[index];
    const nextMsg = messages[index + 1];
    return currentMsg.senderId !== nextMsg?.senderId;
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-line-green animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-line-gray"
    >
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="mb-2 text-center text-sm text-yellow-600 bg-yellow-50 py-2 rounded-lg">
          Reconnecting to server...
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isSent={message.senderId === currentUserId}
          showAvatar={shouldShowAvatar(index)}
          onDelete={onDeleteMessage}
        />
      ))}

      {typingUsers.length > 0 && (
        <div className="flex items-start gap-2">
          <TypingIndicator userName={typingUsers[0].userName} />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
