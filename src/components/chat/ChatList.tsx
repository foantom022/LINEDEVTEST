'use client';

import { useChatStore } from '@/store/chatStore';
import { useConversations } from '@/hooks/useConversations';
import { ChatListItem } from './ChatListItem';
import { Search, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';

interface ChatListProps {
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string | null;
}

export function ChatList({
  currentUserId,
  onSelectConversation,
  currentConversationId,
}: ChatListProps) {
  const { conversations } = useConversations();
  const { isLoading } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      if (conv.type === 'GROUP') {
        return conv.name?.toLowerCase().includes(query);
      }

      const otherParticipant = conv.participants.find(
        (p) => p.userId !== currentUserId
      );
      return otherParticipant?.user.displayName.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, currentUserId]);

  // Sort: pinned first, then by last message time
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const aParticipant = a.participants.find((p) => p.userId === currentUserId);
      const bParticipant = b.participants.find((p) => p.userId === currentUserId);

      const aPinned = aParticipant?.isPinned || false;
      const bPinned = bParticipant?.isPinned || false;

      if (aPinned !== bPinned) {
        return bPinned ? 1 : -1;
      }

      const aTime = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.updatedAt).getTime();
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : new Date(b.updatedAt).getTime();

      return bTime - aTime;
    });
  }, [filteredConversations, currentUserId]);

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-line-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Chats</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-line-green"
        >
          <Edit className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-line-green"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <p className="text-center">
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet. Start chatting!'}
            </p>
          </div>
        ) : (
          sortedConversations.map((conversation) => (
            <ChatListItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              isActive={conversation.id === currentConversationId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
