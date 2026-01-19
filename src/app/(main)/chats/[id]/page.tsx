'use client';

import { ChatRoom } from '@/components/chat/ChatRoom';
import { ChatList } from '@/components/chat/ChatList';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChatStore } from '@/store/chatStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ChatRoomPage() {
  const { currentUser } = useCurrentUser();
  const { conversations, setCurrentConversationId, getCurrentConversation } =
    useChatStore();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, setCurrentConversationId]);

  const currentConversation = getCurrentConversation();

  if (!currentUser) {
    return null;
  }

  const handleSelectConversation = (newConversationId: string) => {
    setCurrentConversationId(newConversationId);
    router.push(`/chats/${newConversationId}`);
  };

  // Loading state
  if (!currentConversation && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-line-green animate-spin" />
      </div>
    );
  }

  // Conversation not found
  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Conversation not found</p>
          <button
            onClick={() => router.push('/chats')}
            className="text-line-green hover:underline"
          >
            Back to chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Chat List (Desktop only) */}
      <div className="hidden lg:block lg:w-96 lg:border-r border-gray-200 h-full">
        <ChatList
          currentUserId={currentUser.id}
          onSelectConversation={handleSelectConversation}
          currentConversationId={conversationId}
        />
      </div>

      {/* Chat Room */}
      <div className="flex-1">
        <ChatRoom conversation={currentConversation} currentUserId={currentUser.id} />
      </div>
    </div>
  );
}
