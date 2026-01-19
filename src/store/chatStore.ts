import { create } from 'zustand';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'STICKER' | 'VOICE' | 'LOCATION';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  stickerId?: string | null;
  replyToId?: string | null;
  isDeleted: boolean;
  deletedFor: string[];
  isPinned: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  sender: {
    id: string;
    displayName: string;
    profileImage?: string | null;
    isOnline: boolean;
  };
  replyTo?: Message | null;
  readReceipts?: {
    id: string;
    userId: string;
    readAt: string | Date;
  }[];
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  participants: {
    id: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    lastReadAt?: string | Date | null;
    isMuted: boolean;
    isPinned: boolean;
    user: {
      id: string;
      displayName: string;
      profileImage?: string | null;
      isOnline: boolean;
      lastSeen: string | Date;
    };
  }[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

interface TypingUser {
  userId: string;
  userName: string;
  conversationId: string;
}

interface ChatStore {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingUser[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setCurrentConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string, conversationId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getCurrentConversation: () => Conversation | null;
  getCurrentMessages: () => Message[];
  getUnreadCount: (conversationId: string, userId: string) => number;
  markAsRead: (conversationId: string, userId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: {},
  typingUsers: [],
  isLoading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),

  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      const messageExists = existingMessages.some((m) => m.id === message.id);

      if (messageExists) {
        return state;
      }

      const updatedMessages = [...existingMessages, message];

      // Update conversation's last message
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: message,
            updatedAt: message.createdAt,
          };
        }
        return conv;
      });

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
        conversations: updatedConversations,
      };
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),

  deleteMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (msg) => msg.id !== messageId
        ),
      },
    })),

  addTypingUser: (user) =>
    set((state) => {
      const exists = state.typingUsers.some(
        (u) => u.userId === user.userId && u.conversationId === user.conversationId
      );
      if (exists) return state;
      return { typingUsers: [...state.typingUsers, user] };
    }),

  removeTypingUser: (userId, conversationId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (u) => !(u.userId === userId && u.conversationId === conversationId)
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getCurrentConversation: () => {
    const state = get();
    if (!state.currentConversationId) return null;
    return (
      state.conversations.find((conv) => conv.id === state.currentConversationId) || null
    );
  },

  getCurrentMessages: () => {
    const state = get();
    if (!state.currentConversationId) return [];
    return state.messages[state.currentConversationId] || [];
  },

  getUnreadCount: (conversationId, userId) => {
    const state = get();
    const conversation = state.conversations.find((c) => c.id === conversationId);
    if (!conversation) return 0;

    const participant = conversation.participants.find((p) => p.userId === userId);
    if (!participant) return 0;

    const messages = state.messages[conversationId] || [];
    const lastReadAt = participant.lastReadAt ? new Date(participant.lastReadAt) : null;

    return messages.filter((msg) => {
      if (msg.senderId === userId) return false;
      if (!lastReadAt) return true;
      return new Date(msg.createdAt) > lastReadAt;
    }).length;
  },

  markAsRead: (conversationId, userId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            participants: conv.participants.map((p) =>
              p.userId === userId ? { ...p, lastReadAt: new Date().toISOString() } : p
            ),
            unreadCount: 0,
          };
        }
        return conv;
      }),
    })),
}));
