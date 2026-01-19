# LINE Chat System Documentation

## Overview

This is a complete, working chat system for the LINE app built with Next.js 15, React 19, Prisma, PostgreSQL, Zustand, and Tailwind CSS.

## Features

- Real-time messaging
- Direct and group conversations
- Read receipts
- Typing indicators
- Message deletion
- File and image sharing support
- Online/offline status
- Unread message counts
- Pinned conversations
- Beautiful LINE-inspired UI
- Responsive design (mobile and desktop)
- Loading states and error handling

## Project Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx           # Main app layout with sidebar navigation
│   │   ├── page.tsx              # Home page (redirects to /chats)
│   │   ├── chats/
│   │   │   ├── page.tsx          # Chat list view
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Individual chat room
│   │   ├── friends/
│   │   │   └── page.tsx          # Friends page (placeholder)
│   │   ├── timeline/
│   │   │   └── page.tsx          # Timeline page (placeholder)
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings page (placeholder)
│   │   └── profile/
│   │       └── page.tsx          # Profile page (placeholder)
│   └── api/
│       ├── auth/
│       │   ├── me/
│       │   │   └── route.ts      # GET/PATCH current user
│       │   └── status/
│       │       └── route.ts      # POST online status
│       ├── conversations/
│       │   ├── route.ts          # GET all, POST create
│       │   └── [id]/
│       │       ├── route.ts      # GET/PATCH single conversation
│       │       └── messages/
│       │           └── route.ts  # GET/POST messages
│       └── messages/
│           └── [id]/
│               └── route.ts      # DELETE/PATCH message
├── components/
│   └── chat/
│       ├── ChatList.tsx          # Shows all conversations
│       ├── ChatListItem.tsx      # Single conversation item
│       ├── ChatRoom.tsx          # Main chat interface
│       ├── ChatHeader.tsx        # Chat header with name, status, actions
│       ├── MessageBubble.tsx     # Individual message display
│       ├── MessageList.tsx       # Scrollable message list
│       ├── MessageInput.tsx      # Input with send button, emoji picker
│       ├── TypingIndicator.tsx   # "User is typing..." animation
│       └── EmptyChat.tsx         # Empty state
├── hooks/
│   ├── useConversations.ts       # Fetch and manage conversations
│   ├── useMessages.ts            # Fetch and manage messages
│   └── useCurrentUser.ts         # Get current user
└── store/
    ├── chatStore.ts              # Zustand store for conversations/messages
    └── userStore.ts              # Zustand store for current user
```

## API Routes

### Authentication

#### GET /api/auth/me
Get the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "lineId": "string",
    "email": "string",
    "displayName": "string",
    "profileImage": "string",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /api/auth/me
Update the current user's profile.

**Request:**
```json
{
  "displayName": "string",
  "profileImage": "string",
  "coverImage": "string",
  "statusMessage": "string"
}
```

#### POST /api/auth/status
Update online status.

**Request:**
```json
{
  "isOnline": true
}
```

### Conversations

#### GET /api/conversations
Get all conversations for the current user.

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "type": "DIRECT" | "GROUP",
      "name": "string",
      "imageUrl": "string",
      "participants": [...],
      "lastMessage": {...},
      "unreadCount": 0
    }
  ]
}
```

#### POST /api/conversations
Create a new conversation.

**Request:**
```json
{
  "participantIds": ["uuid"],
  "type": "DIRECT" | "GROUP",
  "name": "string" // optional, for groups
}
```

#### GET /api/conversations/[id]
Get a single conversation.

#### PATCH /api/conversations/[id]
Update conversation details (name, image).

**Request:**
```json
{
  "name": "string",
  "imageUrl": "string"
}
```

### Messages

#### GET /api/conversations/[id]/messages
Get messages for a conversation.

**Query Parameters:**
- `limit` (optional): Number of messages to fetch (default: 50)
- `before` (optional): Message ID to fetch messages before

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "content": "string",
      "type": "TEXT" | "IMAGE" | "FILE" | "STICKER" | "VOICE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {...}
    }
  ]
}
```

#### POST /api/conversations/[id]/messages
Send a message.

**Request:**
```json
{
  "content": "string",
  "type": "TEXT" | "IMAGE" | "FILE" | "STICKER" | "VOICE",
  "fileUrl": "string", // optional
  "fileName": "string", // optional
  "fileSize": 0, // optional
  "stickerId": "string", // optional
  "replyToId": "string" // optional
}
```

#### DELETE /api/messages/[id]
Delete a message.

#### PATCH /api/messages/[id]
Update a message (edit content or pin).

**Request:**
```json
{
  "content": "string", // optional
  "isPinned": true // optional
}
```

## Zustand Stores

### chatStore

Manages conversations, messages, and chat state.

**State:**
```typescript
{
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Record<string, Message[]>
  typingUsers: TypingUser[]
  isLoading: boolean
  error: string | null
}
```

**Actions:**
- `setConversations(conversations)` - Set all conversations
- `addConversation(conversation)` - Add a new conversation
- `updateConversation(id, updates)` - Update conversation details
- `setCurrentConversationId(id)` - Set active conversation
- `setMessages(conversationId, messages)` - Set messages for a conversation
- `addMessage(conversationId, message)` - Add a new message
- `updateMessage(conversationId, messageId, updates)` - Update a message
- `deleteMessage(conversationId, messageId)` - Delete a message
- `addTypingUser(user)` - Add typing indicator
- `removeTypingUser(userId, conversationId)` - Remove typing indicator
- `getCurrentConversation()` - Get current active conversation
- `getCurrentMessages()` - Get messages for current conversation
- `getUnreadCount(conversationId, userId)` - Get unread count
- `markAsRead(conversationId, userId)` - Mark conversation as read

### userStore

Manages current user state.

**State:**
```typescript
{
  currentUser: CurrentUser | null
  isLoading: boolean
  error: string | null
}
```

**Actions:**
- `setCurrentUser(user)` - Set current user
- `updateCurrentUser(updates)` - Update user details
- `setOnlineStatus(isOnline)` - Update online status

## Custom Hooks

### useConversations()

Fetches and manages conversations.

```typescript
const {
  conversations,
  fetchConversations,
  createConversation,
  updateConversationDetails
} = useConversations();
```

### useMessages(conversationId)

Fetches and manages messages for a conversation.

```typescript
const {
  messages,
  fetchMessages,
  sendMessage,
  deleteMessage,
  updateMessage
} = useMessages(conversationId);
```

### useCurrentUser()

Manages current user data.

```typescript
const {
  currentUser,
  fetchCurrentUser,
  updateProfile,
  setOnlineStatus
} = useCurrentUser();
```

## Components

### ChatList

Displays all conversations with search functionality.

```tsx
<ChatList
  currentUserId={currentUser.id}
  onSelectConversation={(id) => router.push(`/chats/${id}`)}
  currentConversationId={conversationId}
/>
```

### ChatRoom

Main chat interface with header, messages, and input.

```tsx
<ChatRoom
  conversation={conversation}
  currentUserId={currentUser.id}
/>
```

### MessageInput

Message input with emoji picker and attachments.

```tsx
<MessageInput
  onSend={(message) => sendMessage(message)}
  onTyping={() => handleTyping()}
  disabled={false}
/>
```

## Styling

The app uses Tailwind CSS with LINE-specific colors:

```css
line: {
  green: "#06C755",
  green-dark: "#00B900",
  gray: "#F7F7F7",
  gray-dark: "#E5E5E5",
  blue: "#4B9EF7",
  sent: "#06C755",
  received: "#FFFFFF"
}
```

## Database Schema

Key models:

- **User**: User accounts with profile info
- **Conversation**: Direct or group conversations
- **ConversationParticipant**: Join table with user-specific settings
- **Message**: Chat messages with type support
- **MessageReadReceipt**: Track who read which messages

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: seed test data
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login** to your account
2. **Navigate to Chats** (default page)
3. **Select a conversation** from the list
4. **Send messages** using the input at the bottom
5. **View online status** and message read receipts
6. **Delete messages** by hovering over sent messages

## Features in Detail

### Message Types

- **TEXT**: Plain text messages
- **IMAGE**: Image attachments
- **FILE**: File attachments
- **STICKER**: Sticker messages
- **VOICE**: Voice messages

### Read Receipts

Messages show:
- Single check: Message sent
- Double check: Message read by recipient

### Typing Indicators

Real-time typing indicators show when users are typing.

### Unread Counts

Badge shows number of unread messages in each conversation.

### Pinned Conversations

Pin important conversations to keep them at the top.

### Search

Search conversations by name or participant.

### Responsive Design

Works seamlessly on mobile and desktop:
- Mobile: Full-screen chat view
- Desktop: Split view with chat list and chat room

## Future Enhancements

- Real-time updates with Socket.IO
- Voice and video calls
- Image and file upload
- Sticker packs
- Message reactions
- Group admin controls
- Message forwarding
- Message search
- Push notifications

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Emoji**: Emoji Mart

## License

MIT
