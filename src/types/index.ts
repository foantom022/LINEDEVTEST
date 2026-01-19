import {
  User,
  Conversation,
  Message,
  Friendship,
  Post,
  StickerPack,
  Call,
  Notification,
} from '@prisma/client';

// User types
export type UserWithRelations = User & {
  sentFriendRequests?: Friendship[];
  receivedFriendRequests?: Friendship[];
};

export type SafeUser = Omit<User, 'passwordHash' | 'emailVerified'>;

// Conversation types
export type ConversationWithDetails = Conversation & {
  participants: Array<{
    id: string;
    user: SafeUser;
    role: string;
    lastReadAt: Date | null;
  }>;
  messages: MessageWithSender[];
  _count?: {
    messages: number;
    participants: number;
  };
};

// Message types
export type MessageWithSender = Message & {
  sender: SafeUser;
  replyTo?: MessageWithSender | null;
  readReceipts?: Array<{
    userId: string;
    readAt: Date;
  }>;
};

// Friend types
export type FriendWithUser = Friendship & {
  friend: SafeUser;
  user: SafeUser;
};

// Post types
export type PostWithDetails = Post & {
  user: SafeUser;
  likes: Array<{
    id: string;
    userId: string;
    user: SafeUser;
  }>;
  comments: Array<{
    id: string;
    content: string;
    userId: string;
    user: SafeUser;
    createdAt: Date;
  }>;
  _count?: {
    likes: number;
    comments: number;
  };
};

// Call types
export type CallWithDetails = Call & {
  conversation: Conversation;
  initiator: SafeUser;
  participants: Array<{
    userId: string;
    user: SafeUser;
    joinedAt: Date;
    leftAt: Date | null;
  }>;
};

// Notification types
export type NotificationWithDetails = Notification;

// Socket event types
export interface SocketEvents {
  // User events
  'user:online': { userId: string };
  'user:offline': { userId: string };

  // Typing events
  'typing:start': { conversationId: string; userId: string; displayName: string };
  'typing:stop': { conversationId: string; userId: string };

  // Message events
  'message:new': { conversationId: string; message: MessageWithSender };
  'message:updated': { messageId: string; updates: Partial<Message> };
  'message:deleted': { messageId: string; conversationId: string };
  'message:read': { messageId: string; userId: string; readAt: Date };

  // Call events
  'call:incoming': { call: CallWithDetails };
  'call:joined': { callId: string; userId: string };
  'call:left': { callId: string; userId: string };
  'call:ended': { callId: string };
  'call:signal': { to: string; from: string; signal: any };

  // Notification events
  'notification:new': { notification: NotificationWithDetails };
}

// Form types
export interface RegisterFormData {
  lineId: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  identifier: string; // email, phone, or lineId
  password: string;
}

export interface MessageFormData {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'STICKER' | 'VOICE' | 'LOCATION';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  stickerId?: string;
  replyToId?: string;
}

export interface CreateConversationData {
  type: 'DIRECT' | 'GROUP';
  name?: string;
  imageUrl?: string;
  participantIds: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}
