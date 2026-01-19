# Socket.io Real-time Messaging - Quick Start Guide

## Overview

This LINE-style chat application now features a complete Socket.io real-time messaging system with:
- Instant message delivery
- Typing indicators
- Online/offline status
- Read receipts
- Automatic reconnection

## Getting Started

### 1. Install Dependencies

All required dependencies are already in package.json:
- `socket.io` - Server-side Socket.io
- `socket.io-client` - Client-side Socket.io

### 2. Start the Development Server

```bash
npm run dev
```

This runs the custom server (via `tsx watch server.js`) which:
- Starts Next.js on port 3000
- Initializes Socket.io server
- Enables hot reloading

### 3. How It Works

#### Architecture Flow:

```
User Login → SessionProvider → SocketProvider → Socket Connection
                                      ↓
                              Socket Server (server.js)
                                      ↓
                              Real-time Events
                                      ↓
                    MessageList ← Socket Events → MessageInput
                         ↓                             ↓
                   Zustand Store ← → useMessages Hook
```

## Using the Components

### Basic Chat Implementation

The easiest way to use the system is with the existing ChatRoom component:

```tsx
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useChatStore } from '@/store/chatStore';

export default function ConversationPage({ params }: { params: { id: string } }) {
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === params.id)
  );
  const currentUserId = 'user-id'; // Get from session

  if (!conversation) return <div>Loading...</div>;

  return (
    <ChatRoom
      conversation={conversation}
      currentUserId={currentUserId}
    />
  );
}
```

### Individual Components

If you want more control, use components separately:

```tsx
'use client';

import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useSocketContext } from '@/components/providers/SocketProvider';

export function MyChat({ conversationId, userId, displayName }) {
  const { isConnected } = useSocketContext();

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b">
        Chat Room
        {isConnected ? (
          <span className="text-green-500">Connected</span>
        ) : (
          <span className="text-yellow-500">Connecting...</span>
        )}
      </div>

      <MessageList
        conversationId={conversationId}
        currentUserId={userId}
      />

      <MessageInput
        conversationId={conversationId}
        userId={userId}
        displayName={displayName}
      />
    </div>
  );
}
```

## Key Features

### 1. Real-time Message Delivery

Messages are delivered instantly via Socket.io:

```typescript
// Sending (happens automatically in MessageInput)
socket.emit('message:send', {
  conversationId,
  senderId,
  content,
  type: 'TEXT'
});

// Receiving (handled automatically in MessageList)
socket.on('message:new', (message) => {
  // Message is added to Zustand store and UI updates
});
```

### 2. Typing Indicators

Users see when others are typing:

```typescript
import { useTyping } from '@/hooks/useTyping';

const { typingUsers, startTyping, stopTyping } = useTyping({
  conversationId,
  userId,
  displayName,
  socket
});

// On input change
onChange={() => startTyping()}

// On send or blur
onSend={() => stopTyping()}
```

### 3. Read Receipts

Messages show read status with checkmarks:
- Single checkmark: Sent
- Double checkmark: Read by recipient

### 4. Online Status

User presence is automatically tracked:
- Green dot: Online
- Last seen time: Offline

## Customization

### Change Socket.io Path

In `src/server/socket.ts`:
```typescript
this.io = new SocketIOServer(server, {
  path: '/api/socket', // Change this
  // ...
});
```

Update client to match in `src/components/providers/SocketProvider.tsx`:
```typescript
const socketInstance = io({
  path: '/api/socket', // Change this
  // ...
});
```

### Adjust Typing Timeout

In your component:
```typescript
useTyping({
  // ...
  typingTimeout: 5000, // 5 seconds instead of default 3
});
```

### Disable Auto-reconnection

In `SocketProvider.tsx`:
```typescript
const socketInstance = io({
  // ...
  reconnection: false, // Disable
});
```

## Debugging

### Check Socket Connection

```typescript
import { useSocketContext } from '@/components/providers/SocketProvider';

const { socket, isConnected } = useSocketContext();

console.log('Socket ID:', socket?.id);
console.log('Connected:', isConnected);
```

### Monitor Events

In browser console:
```javascript
// Socket connection events are logged automatically
// Look for:
// "Socket connected: [socket-id]"
// "User registered: [user-id] on socket [socket-id]"
```

### Server Logs

Server logs show:
```
> Ready on http://localhost:3000
> Socket.io initialized
Socket connected: abc123
User registered: user-xyz on socket abc123
Message sent in conversation conv-123
```

## Common Issues

### 1. Socket Not Connecting

**Problem**: Connection status shows "Connecting..." indefinitely

**Solutions**:
- Ensure custom server is running (`npm run dev`)
- Check browser console for errors
- Verify user is logged in (Socket requires userId)
- Check `NEXT_PUBLIC_APP_URL` in .env

### 2. Messages Not Appearing

**Problem**: Messages sent but not received

**Solutions**:
- Check socket connection status
- Verify user joined conversation room
- Check browser console for socket events
- Ensure Zustand store is properly initialized

### 3. Typing Indicators Not Working

**Problem**: Can't see when others are typing

**Solutions**:
- Verify socket connection
- Check typing timeout hasn't expired
- Ensure both users are in same conversation
- Check browser console for typing events

### 4. Hot Reload Issues

**Problem**: Server crashes on file change

**Solutions**:
- tsx watch should handle this automatically
- If issues persist, manually restart: `npm run dev`
- Check for TypeScript errors

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Start Production Server

```bash
NODE_ENV=production node server.js
```

### 3. Environment Variables

Required for production:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Considerations

- Use a process manager (PM2, systemd)
- Set up SSL/TLS for secure connections
- Configure CORS for your domain
- Use WebSocket-compatible hosting (Vercel, Railway, etc.)
- Consider Redis for multi-server setups

## Advanced Usage

### Custom Socket Events

Add your own events in `src/server/socket.ts`:

```typescript
socket.on('custom:event', (data) => {
  // Handle custom event
  this.io.to(`conversation:${data.conversationId}`).emit('custom:response', {
    // Response data
  });
});
```

Listen on client:

```typescript
useEffect(() => {
  if (!socket) return;

  socket.on('custom:response', (data) => {
    // Handle response
  });

  return () => {
    socket.off('custom:response');
  };
}, [socket]);
```

### Multi-server Setup with Redis

For horizontal scaling, use Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

In `src/server/socket.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

this.io.adapter(createAdapter(pubClient, subClient));
```

## Testing

### Manual Testing

1. Open app in two browser windows
2. Log in as different users
3. Start a conversation
4. Test:
   - Message sending
   - Typing indicators
   - Read receipts
   - Online/offline status

### Automated Testing

Consider using:
- `socket.io-client` for integration tests
- `@testing-library/react` for component tests
- `jest` for unit tests

## Support

For more details, see:
- `SOCKET_IO_SETUP.md` - Complete technical documentation
- `src/server/socket.ts` - Server implementation
- `src/hooks/useSocket.ts` - Client hook
- `src/hooks/useTyping.ts` - Typing indicator hook

## Next Steps

1. Implement file uploads
2. Add message reactions
3. Implement voice/video calls
4. Add push notifications
5. Implement end-to-end encryption
