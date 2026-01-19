'use client';

import { Conversation } from '@/store/chatStore';
import { useMessages } from '@/hooks/useMessages';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatRoomProps {
  conversation: Conversation;
  currentUserId: string;
}

export function ChatRoom({ conversation, currentUserId }: ChatRoomProps) {
  const { deleteMessage } = useMessages(conversation.id);
  const { currentUser } = useUserStore();
  const { isLoading } = useChatStore();

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-line-gray">
      <ChatHeader conversation={conversation} currentUserId={currentUserId} />
      <MessageList
        conversationId={conversation.id}
        currentUserId={currentUserId}
        isLoading={isLoading}
        onDeleteMessage={handleDeleteMessage}
      />
      <MessageInput
        conversationId={conversation.id}
        userId={currentUserId}
        displayName={currentUser.displayName}
      />
    </div>
  );
}
