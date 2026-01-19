'use client';

import { formatTime } from '@/lib/utils';
import { Message } from '@/store/chatStore';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Image as ImageIcon, File, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  showAvatar?: boolean;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isSent,
  showAvatar = true,
  onDelete,
}: MessageBubbleProps) {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="relative">
            {message.fileUrl ? (
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Image'}
                className="max-w-xs rounded-lg"
              />
            ) : (
              <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
                <ImageIcon className="w-6 h-6" />
                <span>{message.fileName || 'Image'}</span>
              </div>
            )}
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'FILE':
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg min-w-[200px]">
            <div className="bg-white p-2 rounded">
              <File className="w-6 h-6 text-line-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              {message.fileSize && (
                <p className="text-xs text-gray-500">
                  {(message.fileSize / 1024).toFixed(2)} KB
                </p>
              )}
            </div>
          </div>
        );

      case 'TEXT':
      default:
        return (
          <div>
            {message.replyTo && (
              <div className="mb-2 p-2 bg-black/5 rounded border-l-2 border-line-green">
                <p className="text-xs font-medium text-gray-700">
                  {message.replyTo.sender.displayName}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {message.replyTo.content}
                </p>
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        );
    }
  };

  const hasReadReceipts = message.readReceipts && message.readReceipts.length > 1;

  return (
    <div
      className={cn(
        'flex gap-2 group',
        isSent ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isSent && (
        <div className="flex-shrink-0">
          {message.sender.profileImage ? (
            <img
              src={message.sender.profileImage}
              alt={message.sender.displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-line-green flex items-center justify-center text-white text-sm font-medium">
              {message.sender.displayName[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isSent ? 'items-end' : 'items-start'
        )}
      >
        {!isSent && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.sender.displayName}
          </span>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-2 shadow-sm relative',
            isSent
              ? 'bg-line-green text-white rounded-tr-sm'
              : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
          )}
        >
          {renderMessageContent()}

          {/* Delete button (only for sent messages) */}
          {isSent && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
              title="Delete message"
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Timestamp and Read Status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 px-2',
            isSent ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-xs text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {isSent && (
            <div className="text-white">
              {hasReadReceipts ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacer for sent messages without avatar */}
      {isSent && <div className="w-8" />}
    </div>
  );
}
