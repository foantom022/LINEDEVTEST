# Quick Start Guide

## Get the Chat System Running in 5 Minutes

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Basic understanding of Next.js and React

### Step 1: Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lineapp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars-long"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Socket.IO (optional, defaults to same origin)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### Step 2: Install & Setup Database

```bash
# Install dependencies (already done)
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Seed test data
npm run db:seed
```

### Step 3: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Step 4: Create Test Users

#### Option 1: Via UI
1. Go to `/register`
2. Create 2 accounts (e.g., user1@example.com, user2@example.com)

#### Option 2: Via Database Seed (if available)
```bash
npm run db:seed
```

### Step 5: Test the Chat

1. **Login** as User 1
2. **Navigate** to `/chats`
3. **Create** a new conversation (if UI available) or via API:

```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": ["user-2-id"],
    "type": "DIRECT"
  }'
```

4. **Send messages** using the chat interface
5. **Open** another browser/incognito as User 2
6. **See real-time** messages appear!

## Common Tasks

### Create a Direct Conversation

```typescript
import { useConversations } from '@/hooks/useConversations';

const { createConversation } = useConversations();

const conversation = await createConversation(
  [otherUserId],
  'DIRECT'
);
```

### Create a Group Conversation

```typescript
const conversation = await createConversation(
  [userId1, userId2, userId3],
  'GROUP',
  'My Group Chat'
);
```

### Send a Text Message

```typescript
import { useMessages } from '@/hooks/useMessages';

const { sendMessage } = useMessages(conversationId);

await sendMessage('Hello, world!');
```

### Send an Image Message

```typescript
await sendMessage(
  'Check this out!',
  'IMAGE',
  {
    fileUrl: 'https://example.com/image.jpg',
    fileName: 'photo.jpg',
    fileSize: 123456
  }
);
```

### Delete a Message

```typescript
const { deleteMessage } = useMessages(conversationId);

await deleteMessage(messageId);
```

### Get Current User

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

const { currentUser } = useCurrentUser();

console.log(currentUser?.displayName);
```

### Update User Profile

```typescript
const { updateProfile } = useCurrentUser();

await updateProfile({
  displayName: 'New Name',
  statusMessage: 'Available'
});
```

## Using Components

### ChatList Component

```tsx
import { ChatList } from '@/components/chat/ChatList';

<ChatList
  currentUserId={user.id}
  onSelectConversation={(id) => router.push(`/chats/${id}`)}
  currentConversationId={currentId}
/>
```

### ChatRoom Component

```tsx
import { ChatRoom } from '@/components/chat/ChatRoom';

<ChatRoom
  conversation={conversation}
  currentUserId={user.id}
/>
```

### MessageInput Component

```tsx
import { MessageInput } from '@/components/chat/MessageInput';

<MessageInput
  conversationId={conversationId}
  userId={user.id}
  displayName={user.displayName}
/>
```

## Styling Customization

### Change LINE Green Color

Edit `tailwind.config.ts`:

```typescript
colors: {
  line: {
    green: "#YOUR_COLOR",
    "green-dark": "#DARKER_SHADE",
  }
}
```

### Customize Message Bubbles

Edit `/src/components/chat/MessageBubble.tsx`:

```tsx
// Sent messages
className={cn(
  'rounded-2xl px-4 py-2',
  isSent
    ? 'bg-YOUR_COLOR text-white' // Change this
    : 'bg-white text-gray-900'
)}
```

## API Endpoints Reference

### Get All Conversations
```http
GET /api/conversations
Authorization: Session cookie
```

### Create Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "participantIds": ["uuid"],
  "type": "DIRECT" | "GROUP",
  "name": "Group Name" // optional, for groups
}
```

### Get Messages
```http
GET /api/conversations/:id/messages?limit=50&before=messageId
Authorization: Session cookie
```

### Send Message
```http
POST /api/conversations/:id/messages
Content-Type: application/json

{
  "content": "Hello!",
  "type": "TEXT",
  "replyToId": "uuid" // optional
}
```

### Delete Message
```http
DELETE /api/messages/:id
Authorization: Session cookie
```

## Socket.IO Events

### Client → Server

```typescript
// Join conversation room
socket.emit('conversation:join', conversationId);

// Leave conversation room
socket.emit('conversation:leave', conversationId);

// Send message
socket.emit('message:send', {
  conversationId,
  senderId,
  content,
  type: 'TEXT'
});

// Mark message as read
socket.emit('message:read', {
  messageId,
  userId,
  conversationId
});

// Typing indicators
socket.emit('typing:start', {
  conversationId,
  userId,
  displayName
});

socket.emit('typing:stop', {
  conversationId,
  userId
});
```

### Server → Client

```typescript
// New message received
socket.on('message:new', (message) => {
  // Add to store
});

// Message read by recipient
socket.on('message:read', (data) => {
  // Update read receipts
});

// User started typing
socket.on('typing:start', (data) => {
  // Show typing indicator
});

// User stopped typing
socket.on('typing:stop', (data) => {
  // Hide typing indicator
});
```

## Troubleshooting

### Chat List is Empty
- Check if you have any conversations created
- Verify authentication is working
- Check browser console for errors

### Messages Not Appearing in Real-time
- Check Socket.IO connection status (look for "Reconnecting to server..." message)
- Verify `NEXT_PUBLIC_SOCKET_URL` in .env
- Check server logs for Socket.IO errors

### TypeScript Errors
- Run `npm run db:generate` to regenerate Prisma client
- Restart TypeScript server in your IDE
- Some route handler type errors are expected with Next.js 15 (non-breaking)

### Database Connection Errors
- Verify `DATABASE_URL` in .env is correct
- Ensure PostgreSQL is running
- Check database exists and is accessible

### Authentication Issues
- Clear cookies and try logging in again
- Verify `NEXTAUTH_SECRET` is set (min 32 characters)
- Check `NEXTAUTH_URL` matches your development URL

## Development Tips

### Hot Reload Issues
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### View Database
```bash
# Open Prisma Studio
npm run db:studio
```

### Reset Database
```bash
# Warning: This deletes all data!
npm run db:push -- --force-reset
```

### Check for Updates
```bash
# Update all dependencies
npm update

# Check for outdated packages
npm outdated
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-new-secret"
NEXT_PUBLIC_SOCKET_URL="https://your-domain.com"
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Recommended Hosting

- **Vercel**: Easiest for Next.js (auto-deploys from Git)
- **Railway**: Good for PostgreSQL + Next.js
- **Render**: Free tier available
- **AWS/GCP/Azure**: For enterprise

### Database Hosting

- **Supabase**: Free PostgreSQL with pgAdmin
- **Railway**: Integrated with app hosting
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Enterprise option

## Next Steps

1. **Add File Upload**: Integrate UploadThing or AWS S3
2. **Enable Push Notifications**: Use Firebase Cloud Messaging
3. **Add Voice/Video Calls**: Integrate WebRTC or Twilio
4. **Implement Stickers**: Create sticker packs system
5. **Add Message Reactions**: Emoji reactions on messages
6. **Search Messages**: Full-text search with PostgreSQL
7. **User Presence**: Enhanced online/offline tracking
8. **Read Receipts**: Show who read each message
9. **Message Forwarding**: Forward messages between chats
10. **Dark Mode**: Add theme toggle

## Getting Help

- Check `CHAT_SYSTEM.md` for detailed documentation
- Review `ARCHITECTURE.md` for system design
- See `CHAT_SYSTEM_SUMMARY.md` for feature overview
- Look at component code for implementation examples

## Example: Creating Your First Chat

```typescript
'use client';

import { useEffect } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { ChatRoom } from '@/components/chat/ChatRoom';

export default function MyFirstChat() {
  const { conversations, createConversation } = useConversations();
  const conversation = conversations[0]; // Get first conversation

  useEffect(() => {
    // Create a conversation if none exist
    if (conversations.length === 0) {
      createConversation(
        ['other-user-id'],
        'DIRECT'
      );
    }
  }, []);

  if (!conversation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen">
      <ChatRoom
        conversation={conversation}
        currentUserId="your-user-id"
      />
    </div>
  );
}
```

Happy coding! 🚀
