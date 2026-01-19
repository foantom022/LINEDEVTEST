# Socket.io Real-time Messaging System

This document describes the Socket.io real-time messaging system integrated into the LINE-style chat application.

## Overview

The system provides:
- Real-time message delivery
- Typing indicators
- Online/offline status tracking
- Message read receipts
- Room-based conversation management
- Automatic reconnection handling

## Architecture

### Server Components

#### 1. Socket Server (`src/server/socket.ts`)
The main Socket.io server class that handles:
- User registration and authentication
- Connection/disconnection events
- Message broadcasting
- Read receipts
- Typing indicators
- User presence (online/offline status)

#### 2. Custom Next.js Server (`server.js`)
A custom server that:
- Initializes Next.js
- Integrates Socket.io with the HTTP server
- Runs on port 3000 by default

### Client Components

#### 1. SocketProvider (`src/components/providers/SocketProvider.tsx`)
React Context provider that:
- Initializes socket connection when user logs in
- Manages connection state
- Provides socket instance to child components
- Handles automatic reconnection

#### 2. ClientLayout (`src/components/providers/ClientLayout.tsx`)
Wrapper component that:
- Integrates SessionProvider (NextAuth)
- Wraps app with SocketProvider
- Passes user ID to socket connection

### Hooks

#### 1. useSocket (`src/hooks/useSocket.ts`)
Custom hook for socket operations:
- `sendMessage()` - Send messages via Socket.io
- `markMessageAsRead()` - Mark messages as read
- `joinConversation()` - Join a conversation room
- `leaveConversation()` - Leave a conversation room
- `onNewMessage()` - Listen for new messages
- `onMessageRead()` - Listen for read receipts
- `onUserOnline()` - Listen for user online status
- `onUserOffline()` - Listen for user offline status
- `onTypingStart()` - Listen for typing start events
- `onTypingStop()` - Listen for typing stop events

#### 2. useTyping (`src/hooks/useTyping.ts`)
Custom hook for typing indicators:
- `startTyping()` - Emit typing start event
- `stopTyping()` - Emit typing stop event
- `typingUsers` - Array of users currently typing
- Auto-timeout for typing indicators (3 seconds default)

### UI Components

#### 1. MessageInput (`src/components/chat/MessageInput.tsx`)
Input component with:
- Real-time message sending via Socket.io
- Typing indicator emission
- Connection status display
- File/image upload placeholders
- Enter to send functionality

#### 2. MessageList (`src/components/chat/MessageList.tsx`)
Message list component with:
- Real-time message reception
- Automatic scrolling
- Read receipt updates
- Typing indicator display
- Integration with Zustand store

#### 3. ChatRoom (`src/components/chat/ChatRoom.tsx`)
Complete chat room component that combines:
- MessageList
- MessageInput
- Chat header with user/group info
- Connection status indicator

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `user:register` | `userId: string` | Register user and join their rooms |
| `message:send` | `MessageData` | Send a new message |
| `message:read` | `ReadReceiptData` | Mark message as read |
| `typing:start` | `TypingData` | Start typing indicator |
| `typing:stop` | `TypingData` | Stop typing indicator |
| `conversation:join` | `conversationId: string` | Join conversation room |
| `conversation:leave` | `conversationId: string` | Leave conversation room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | New message received |
| `message:read` | `ReadReceipt` | Message read by user |
| `user:online` | `UserStatus` | User came online |
| `user:offline` | `UserStatus` | User went offline |
| `typing:start` | `TypingUser` | User started typing |
| `typing:stop` | `TypingUser` | User stopped typing |
| `notification:new` | `Notification` | New notification |

## Usage Example

### Basic Chat Room

```tsx
import { ChatRoom } from '@/components/chat/ChatRoom';

export default function ConversationPage({ params }: { params: { id: string } }) {
  return <ChatRoom conversationId={params.id} />;
}
```

### Custom Implementation

```tsx
'use client';

import { useSocketContext } from '@/components/providers/SocketProvider';
import { useTyping } from '@/hooks/useTyping';
import { useSession } from 'next-auth/react';

export function MyCustomChat({ conversationId }: { conversationId: string }) {
  const { socket, isConnected } = useSocketContext();
  const { data: session } = useSession();

  const { typingUsers, startTyping, stopTyping } = useTyping({
    conversationId,
    userId: session?.user?.id || '',
    displayName: session?.user?.name || '',
    socket,
  });

  const sendMessage = (content: string) => {
    if (!socket || !isConnected) return;

    socket.emit('message:send', {
      conversationId,
      senderId: session?.user?.id,
      content,
      type: 'TEXT',
    });
  };

  // ... rest of implementation
}
```

## Running the Server

### Development
```bash
npm run dev
```
This runs the custom server with tsx watch for hot reloading.

### Production
```bash
npm run build
npm start
```

## Environment Variables

Make sure to set these in your `.env`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Key Features

### 1. Automatic Reconnection
The client automatically reconnects if the connection is lost and re-registers the user.

### 2. Room Management
Users are automatically added to:
- Their personal room (`user:{userId}`)
- All conversation rooms they participate in (`conversation:{conversationId}`)

### 3. Typing Indicators
Typing indicators automatically timeout after 3 seconds if not manually stopped.

### 4. Read Receipts
Messages are automatically marked as read when:
- A user views a message in the MessageList
- The message is not sent by the current user

### 5. Online Status
User online/offline status is:
- Updated when they connect/disconnect
- Broadcast to all their friends
- Stored in the database

## Integration with Zustand Store

The Socket.io events integrate seamlessly with the Zustand chat store:
- New messages are added to the store
- Typing users are tracked in the store
- Read receipts update messages in the store
- Real-time updates trigger React re-renders

## Security Considerations

1. **Authentication**: Users must be authenticated via NextAuth to use Socket.io
2. **Authorization**: The server should verify users have access to conversations
3. **Rate Limiting**: Consider adding rate limiting for message sending
4. **Input Validation**: Validate all incoming data on the server

## Troubleshooting

### Socket not connecting
- Check if custom server is running (`npm run dev`)
- Verify `NEXT_PUBLIC_APP_URL` matches your app URL
- Check browser console for connection errors

### Messages not appearing
- Verify socket connection status (`isConnected`)
- Check if user is registered (`user:register` event)
- Ensure conversation room is joined

### Typing indicators not working
- Check typing timeout (default 3 seconds)
- Verify socket connection
- Check browser console for errors

## Future Enhancements

- File upload support
- Image/video message support
- Voice messages
- Message reactions
- Message editing
- Message deletion
- Delivery receipts (separate from read receipts)
- Push notifications for offline users
- End-to-end encryption
