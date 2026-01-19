'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSocketContext } from '@/components/providers/SocketProvider';
import { useTyping } from '@/hooks/useTyping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';
import toast from 'react-hot-toast';

interface MessageInputProps {
  conversationId: string;
  userId: string;
  displayName: string;
  onMessageSent?: () => void;
}

export function MessageInput({
  conversationId,
  userId,
  displayName,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket, isConnected } = useSocketContext();
  const { startTyping, stopTyping } = useTyping({
    conversationId,
    userId,
    displayName,
    socket,
    typingTimeout: 3000,
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Start typing indicator when user types
    if (value.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Handle message send
  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (!isConnected) {
      toast.error('Not connected to server. Please try again.');
      return;
    }

    if (!socket) {
      toast.error('Socket connection not available');
      return;
    }

    try {
      setIsSending(true);

      // Stop typing indicator
      stopTyping();

      // Send message via Socket.io
      socket.emit('message:send', {
        conversationId,
        senderId: userId,
        content: trimmedMessage,
        type: 'TEXT',
      });

      // Clear input
      setMessage('');

      // Focus back on input
      inputRef.current?.focus();

      // Callback
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file upload (placeholder for future implementation)
  const handleFileUpload = () => {
    toast('File upload coming soon!', { icon: '📎' });
  };

  // Handle image upload (placeholder for future implementation)
  const handleImageUpload = () => {
    toast('Image upload coming soon!', { icon: '🖼️' });
  };

  // Handle emoji picker (placeholder for future implementation)
  const handleEmojiPicker = () => {
    toast('Emoji picker coming soon!', { icon: '😊' });
  };

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return (
    <div className="border-t bg-white p-4">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="mb-2 text-center text-sm text-yellow-600 bg-yellow-50 py-1 rounded">
          Reconnecting to server...
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleFileUpload}
            className="h-9 w-9 text-gray-500 hover:text-gray-700"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleImageUpload}
            className="h-9 w-9 text-gray-500 hover:text-gray-700"
            title="Send image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEmojiPicker}
            className="h-9 w-9 text-gray-500 hover:text-gray-700"
            title="Emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {/* Message input */}
        <Input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isSending || !isConnected}
          className="flex-1"
          autoComplete="off"
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending || !isConnected}
          className="h-9 w-9 p-0 bg-green-500 hover:bg-green-600 text-white"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-400">
        Press Enter to send
      </div>
    </div>
  );
}
