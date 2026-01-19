# Implementation Guide - LINE Chat Application

คู่มือการพัฒนา LINE Chat Application แบบทีละขั้นตอน

## ✅ Completed (Phase 0)

- [x] System architecture design
- [x] Database schema with Prisma
- [x] Dependency analysis and recommendations
- [x] Next.js project structure
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Basic authentication configuration

## 📋 Next Steps

### Phase 1: Authentication & User Management (Week 1-2)

#### 1.1 Complete Authentication System
```bash
src/app/(auth)/
├── login/
│   └── page.tsx          # Login page
├── register/
│   └── page.tsx          # Registration page
└── layout.tsx            # Auth layout
```

**Tasks:**
- [ ] Create login page UI
- [ ] Create registration page UI
- [ ] Implement form validation with Zod
- [ ] Create API route for registration
- [ ] Set up NextAuth.js properly
- [ ] Add Google OAuth
- [ ] Handle authentication errors
- [ ] Redirect authenticated users

**Example Register Form:**
```typescript
// src/app/(auth)/register/page.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const registerSchema = z.object({
  lineId: z.string().min(4).max(20).regex(/^[a-z0-9]+$/),
  email: z.string().email(),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword);
```

#### 1.2 User Profile Management
```bash
src/app/(main)/profile/
├── page.tsx              # Profile view
└── edit/
    └── page.tsx          # Edit profile
```

**Tasks:**
- [ ] Display user profile
- [ ] Edit profile (name, status, images)
- [ ] Generate QR code for LINE ID
- [ ] Upload profile/cover images
- [ ] Update online status

---

### Phase 2: Friend System (Week 2-3)

#### 2.1 Friend Management
```bash
src/app/(main)/friends/
├── page.tsx              # Friends list
├── requests/
│   └── page.tsx          # Friend requests
└── add/
    └── page.tsx          # Add friend (ID, QR, Phone)
```

**API Routes to Create:**
```typescript
// src/app/api/friends/route.ts
GET    /api/friends              // List all friends
POST   /api/friends/request      // Send friend request
PATCH  /api/friends/:id/accept   // Accept request
DELETE /api/friends/:id          // Remove/reject friend
POST   /api/friends/:id/block    // Block user
```

**Components:**
```bash
src/components/friends/
├── FriendList.tsx        # List of friends
├── FriendCard.tsx        # Single friend card
├── FriendRequest.tsx     # Friend request item
├── AddFriendModal.tsx    # Add friend modal
└── QRScanner.tsx         # QR code scanner
```

---

### Phase 3: Real-time Chat System (Week 3-5)

#### 3.1 Socket.io Setup
```bash
src/server/
└── socket.ts             # Socket.io server configuration
```

**Socket.io Server:**
```typescript
// src/server/socket.ts
import { Server } from 'socket.io';
import { prisma } from '@/lib/prisma';

export function initializeSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user's room
    socket.on('user:join', async (userId: string) => {
      socket.join(`user:${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      });
      io.emit('user:online', { userId });
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId, userId, displayName }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
        displayName,
      });
    });

    // Send message
    socket.on('message:send', async (data) => {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: data.type,
        },
        include: {
          sender: true,
        },
      });

      io.to(`conversation:${data.conversationId}`).emit('message:new', {
        conversationId: data.conversationId,
        message,
      });
    });

    socket.on('disconnect', async () => {
      // Update user status
    });
  });

  return io;
}
```

#### 3.2 Chat UI Components
```bash
src/components/chat/
├── ChatList.tsx          # List of conversations
├── ChatListItem.tsx      # Single conversation item
├── ChatRoom.tsx          # Main chat room
├── ChatHeader.tsx        # Chat header with user info
├── MessageList.tsx       # List of messages
├── MessageBubble.tsx     # Single message bubble
├── MessageInput.tsx      # Input for sending messages
├── TypingIndicator.tsx   # "User is typing..."
├── FileUpload.tsx        # File upload component
└── EmojiPicker.tsx       # Emoji picker
```

**Example ChatRoom Component:**
```typescript
// src/components/chat/ChatRoom.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Join conversation
    socket.emit('conversation:join', conversationId);

    // Listen for new messages
    socket.on('message:new', ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('message:new');
    };
  }, [socket, conversationId]);

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader conversationId={conversationId} />
      <MessageList messages={messages} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}
```

#### 3.3 Message Features
**Tasks:**
- [ ] Send text messages
- [ ] Send images/videos
- [ ] Send files
- [ ] Send voice messages
- [ ] Reply to messages
- [ ] Forward messages
- [ ] Delete messages (for me / for everyone)
- [ ] Pin messages
- [ ] Search messages
- [ ] Load more messages (pagination)

---

### Phase 4: Group Chat (Week 5-6)

#### 4.1 Group Management
```bash
src/app/(main)/chats/groups/
├── create/
│   └── page.tsx          # Create group
└── [id]/
    ├── page.tsx          # Group chat
    ├── info/
    │   └── page.tsx      # Group info
    └── members/
        └── page.tsx      # Manage members
```

**API Routes:**
```typescript
POST   /api/conversations              // Create group
PATCH  /api/conversations/:id          // Update group info
POST   /api/conversations/:id/members  // Add members
DELETE /api/conversations/:id/members  // Remove members
POST   /api/conversations/:id/leave    // Leave group
```

**Features:**
- [ ] Create group with name and image
- [ ] Add/remove members
- [ ] Set admin roles
- [ ] Group settings
- [ ] Leave group
- [ ] @mentions in messages

---

### Phase 5: Media & Stickers (Week 6-7)

#### 5.1 File Upload
```typescript
// src/app/api/uploadthing/core.ts
import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "10MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      // Auth check
      return { userId: "user-id" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.url);
    }),

  videoUploader: f({ video: { maxFileSize: "100MB", maxFileCount: 1 } })
    .onUploadComplete(({ file }) => {
      console.log("Video uploaded:", file.url);
    }),

  fileUploader: f(["image", "video", "pdf"])
    .onUploadComplete(({ file }) => {
      console.log("File uploaded:", file.url);
    }),
};
```

#### 5.2 Sticker System
**Tasks:**
- [ ] Create sticker packs in database
- [ ] Display sticker picker
- [ ] Send stickers in messages
- [ ] Browse sticker store
- [ ] Purchase/download stickers

---

### Phase 6: Timeline/Posts (Week 7-8)

#### 6.1 Timeline Feature
```bash
src/app/(main)/timeline/
├── page.tsx              # Timeline feed
└── posts/
    └── [id]/
        └── page.tsx      # Single post view
```

**Components:**
```bash
src/components/timeline/
├── Feed.tsx              # Timeline feed
├── Post.tsx              # Single post
├── PostComposer.tsx      # Create post
├── PostActions.tsx       # Like, comment, share
├── Comment.tsx           # Comment component
└── CommentList.tsx       # List of comments
```

**API Routes:**
```typescript
GET    /api/posts                    // Get feed
POST   /api/posts                    // Create post
PATCH  /api/posts/:id                // Update post
DELETE /api/posts/:id                // Delete post
POST   /api/posts/:id/like           // Like post
GET    /api/posts/:id/comments       // Get comments
POST   /api/posts/:id/comments       // Add comment
```

---

### Phase 7: Voice/Video Calls (Week 8-9)

#### 7.1 WebRTC Setup
```bash
src/hooks/
├── useCall.ts            # Call management hook
└── usePeer.ts            # WebRTC peer connection
```

**WebRTC Implementation:**
```typescript
// src/hooks/useCall.ts
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from './useSocket';

export function useCall(conversationId: string) {
  const socket = useSocket();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active'>('idle');
  const peerRef = useRef<SimplePeer.Instance | null>(null);

  const initiateCall = async (isVideo: boolean) => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });

    setStream(mediaStream);
    setCallStatus('calling');

    const peer = new SimplePeer({
      initiator: true,
      stream: mediaStream,
    });

    peer.on('signal', (signal) => {
      socket?.emit('call:signal', {
        to: conversationId,
        signal,
      });
    });

    peerRef.current = peer;
  };

  return { stream, callStatus, initiateCall };
}
```

**Features:**
- [ ] Voice call 1:1
- [ ] Video call 1:1
- [ ] Screen sharing
- [ ] Group voice/video calls
- [ ] Call history

---

### Phase 8: Notifications (Week 9)

#### 8.1 Notification System
```bash
src/components/notifications/
├── NotificationBell.tsx  # Notification icon with count
├── NotificationList.tsx  # List of notifications
└── NotificationItem.tsx  # Single notification
```

**API Routes:**
```typescript
GET    /api/notifications           // Get notifications
PATCH  /api/notifications/:id/read  // Mark as read
PATCH  /api/notifications/read-all  // Mark all as read
```

**Socket Events:**
```typescript
socket.on('notification:new', (notification) => {
  // Show toast notification
  // Update notification count
  // Play sound
});
```

---

### Phase 9: Polish & Optimization (Week 10)

#### 9.1 Performance Optimization
- [ ] Implement virtual scrolling for long message lists
- [ ] Add lazy loading for images
- [ ] Optimize database queries
- [ ] Add caching with Redis
- [ ] Implement service worker for offline support

#### 9.2 UI/UX Improvements
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Improve animations
- [ ] Add dark mode
- [ ] Mobile responsive design
- [ ] Add keyboard shortcuts

#### 9.3 Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] Load testing for Socket.io

---

## 🔧 Development Tips

### 1. Database Seeding
Create seed file for testing:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const password = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      lineId: 'testuser1',
      email: 'user1@test.com',
      displayName: 'Test User 1',
      passwordHash: password,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      lineId: 'testuser2',
      email: 'user2@test.com',
      displayName: 'Test User 2',
      passwordHash: password,
    },
  });

  // Create friendship
  await prisma.friendship.create({
    data: {
      userId: user1.id,
      friendId: user2.id,
      status: 'ACCEPTED',
    },
  });

  // Create conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      createdById: user1.id,
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
        ],
      },
    },
  });

  console.log('Database seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 2. Environment Setup
```bash
# Local development
npm run dev

# Database management
npm run db:studio    # Visual database editor
npm run db:seed      # Seed test data

# Testing
npm run test
npm run test:e2e
```

### 3. Debugging Socket.io
```typescript
// Add debug logging
const socket = io({
  debug: true,
  transports: ['websocket'],
});

socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

---

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.io Docs](https://socket.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [shadcn/ui](https://ui.shadcn.com)

### Tutorials
- [WebRTC Tutorial](https://webrtc.org/getting-started/overview)
- [Real-time Chat with Socket.io](https://socket.io/get-started/chat)
- [File Upload with UploadThing](https://docs.uploadthing.com)

---

## 🎯 Priority Order

1. **Week 1-2**: Authentication & User Management (CRITICAL)
2. **Week 3-5**: Real-time Chat System (CRITICAL)
3. **Week 5-6**: Group Chat (HIGH)
4. **Week 6-7**: Media & Stickers (MEDIUM)
5. **Week 7-8**: Timeline/Posts (MEDIUM)
6. **Week 8-9**: Voice/Video Calls (LOW - Can be Phase 2)
7. **Week 9**: Notifications (HIGH)
8. **Week 10**: Polish & Testing (CRITICAL)

---

## ✅ Current Status

**Completed:**
- System architecture ✅
- Database schema ✅
- Project structure ✅
- Dependencies configured ✅

**Next Immediate Steps:**
1. Run `npm install` to install dependencies
2. Set up PostgreSQL database
3. Configure `.env.local` file
4. Run `npm run db:push` to create database tables
5. Start with Phase 1: Authentication implementation

---

**Good luck with the implementation! 🚀**
