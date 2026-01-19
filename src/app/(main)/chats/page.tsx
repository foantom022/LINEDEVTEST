'use client';

import { ChatList } from '@/components/chat/ChatList';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';

export default function ChatsPage() {
  const { currentUser } = useCurrentUser();
  const { currentConversationId, setCurrentConversationId } = useChatStore();
  const router = useRouter();

  if (!currentUser) {
    return null;
  }

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    router.push(`/chats/${conversationId}`);
  };

  return (
    <div className="flex h-full">
      {/* Chat List */}
      <div className="w-full lg:w-96 lg:border-r border-gray-200 h-full">
        <ChatList
          currentUserId={currentUser.id}
          onSelectConversation={handleSelectConversation}
          currentConversationId={currentConversationId}
        />
      </div>

      {/* Empty State (Desktop only) */}
      <div className="hidden lg:flex flex-1">
        <EmptyChat />
      </div>
    </div>
  );
}
