'use client';

import { Conversation } from '@/store/chatStore';
import { formatTime, isToday, isYesterday } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Pin, Check } from 'lucide-react';

interface ChatListItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
  onClick: () => void;
}

export function ChatListItem({
  conversation,
  currentUserId,
  isActive,
  onClick,
}: ChatListItemProps) {
  const getConversationName = () => {
    if (conversation.type === 'GROUP') {
      return conversation.name || 'Group Chat';
    }

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

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }

    const msg = conversation.lastMessage;
    const isSent = msg.senderId === currentUserId;
    const prefix = isSent ? 'You: ' : '';

    switch (msg.type) {
      case 'IMAGE':
        return `${prefix}📷 Photo`;
      case 'FILE':
        return `${prefix}📎 ${msg.fileName}`;
      case 'STICKER':
        return `${prefix}Sticker`;
      case 'VOICE':
        return `${prefix}🎤 Voice message`;
      default:
        return `${prefix}${msg.content}`;
    }
  };

  const getFormattedTime = () => {
    if (!conversation.lastMessage) {
      return '';
    }

    const date = new Date(conversation.lastMessage.createdAt);

    if (isToday(date)) {
      return formatTime(date);
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const isOnline =
    conversation.type === 'DIRECT' &&
    conversation.participants.find((p) => p.userId !== currentUserId)?.user.isOnline;

  const isPinned = conversation.participants.find(
    (p) => p.userId === currentUserId
  )?.isPinned;

  const unreadCount = conversation.unreadCount || 0;

  const conversationName = getConversationName();
  const conversationImage = getConversationImage();
  const lastMessagePreview = getLastMessagePreview();
  const formattedTime = getFormattedTime();

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100',
        isActive && 'bg-line-gray'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversationImage ? (
          <img
            src={conversationImage}
            alt={conversationName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-line-green flex items-center justify-center text-white font-medium text-lg">
            {conversationName[0].toUpperCase()}
          </div>
        )}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1">
            {conversationName}
            {isPinned && <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {formattedTime}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={cn(
              'text-sm truncate flex-1',
              unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
            )}
          >
            {lastMessagePreview}
          </p>
          {unreadCount > 0 && (
            <div className="flex-shrink-0 ml-2 bg-line-green text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
