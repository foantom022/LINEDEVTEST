'use client';

import { Conversation } from '@/store/chatStore';
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
}

export function ChatHeader({ conversation, currentUserId, onBack }: ChatHeaderProps) {
  const router = useRouter();

  const getConversationName = () => {
    if (conversation.type === 'GROUP') {
      return conversation.name || 'Group Chat';
    }

    // For direct chats, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.user.displayName || 'Unknown';
  };

  const getConversationImage = () => {
    if (conversation.type === 'GROUP') {
      return conversation.imageUrl;
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.user.profileImage;
  };

  const getOnlineStatus = () => {
    if (conversation.type === 'GROUP') {
      const onlineCount = conversation.participants.filter(
        (p) => p.user.isOnline
      ).length;
      return `${onlineCount} online`;
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.user.isOnline ? 'Online' : 'Offline';
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/chats');
    }
  };

  const conversationName = getConversationName();
  const conversationImage = getConversationImage();
  const onlineStatus = getOnlineStatus();

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
      {/* Back button (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        className="lg:hidden"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversationImage ? (
          <img
            src={conversationImage}
            alt={conversationName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-line-green flex items-center justify-center text-white font-medium">
            {conversationName[0].toUpperCase()}
          </div>
        )}
        {conversation.type === 'DIRECT' &&
          conversation.participants.find((p) => p.userId !== currentUserId)?.user
            .isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
      </div>

      {/* Name and Status */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-900 truncate">{conversationName}</h2>
        <p className="text-xs text-gray-500">{onlineStatus}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-line-green"
        >
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-line-green"
        >
          <Video className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-line-green"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
