# Chat System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                        Pages (React)                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │ Chat List    │  │  Chat Room   │  │   Profile    │        │ │
│  │  │   Page       │  │    Page      │  │    Page      │        │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │ │
│  └─────────┼──────────────────┼──────────────────┼────────────────┘ │
│            │                  │                  │                   │
│  ┌─────────▼──────────────────▼──────────────────▼────────────────┐ │
│  │                      Components                                │ │
│  │  ┌───────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │ │
│  │  │ ChatList  │  │ ChatRoom   │  │ MessageList│  │ Message  │ │ │
│  │  │           │  │            │  │            │  │  Input   │ │ │
│  │  └───────────┘  └────────────┘  └────────────┘  └──────────┘ │ │
│  └───────────────────────────────┬─────────────────────────────────┘ │
│                                  │                                   │
│  ┌───────────────────────────────▼─────────────────────────────────┐ │
│  │                      Custom Hooks                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │useConversations│ │useMessages   │  │useCurrentUser│         │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  └─────────┼──────────────────┼──────────────────┼─────────────────┘ │
│            │                  │                  │                   │
│  ┌─────────▼──────────────────▼──────────────────▼─────────────────┐ │
│  │                    Zustand Store                                │ │
│  │  ┌──────────────────┐          ┌──────────────────┐            │ │
│  │  │   chatStore      │          │   userStore      │            │ │
│  │  │  - conversations │          │  - currentUser   │            │ │
│  │  │  - messages      │          │  - isOnline      │            │ │
│  │  │  - typingUsers   │          │                  │            │ │
│  │  └──────────────────┘          └──────────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│            │                  │                  │                   │
│            │                  │                  │                   │
├────────────┼──────────────────┼──────────────────┼───────────────────┤
│            │                  │                  │                   │
│  ┌─────────▼──────────────────▼──────────────────▼─────────────────┐ │
│  │                    Socket.IO Client                             │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ Events: message:new, message:read, typing:start, etc     │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/WebSocket
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                      Server (Next.js)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    API Routes (REST)                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │ │
│  │  │ /api/       │  │ /api/       │  │ /api/       │            │ │
│  │  │ conversations│  │ messages    │  │ auth        │            │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │ │
│  └─────────┼─────────────────┼─────────────────┼────────────────────┘ │
│            │                 │                 │                     │
│  ┌─────────▼─────────────────▼─────────────────▼──────────────────┐ │
│  │                    Socket.IO Server                            │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ Rooms: conversation:${id}                                │ │ │
│  │  │ Events: message:send, typing:start, typing:stop          │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────┬────────────────────────────────────┘ │
│                              │                                       │
│  ┌───────────────────────────▼────────────────────────────────────┐ │
│  │                    NextAuth.js                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ JWT Strategy, Credentials & Google OAuth                 │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────┬────────────────────────────────────┘ │
│                              │                                       │
│  ┌───────────────────────────▼────────────────────────────────────┐ │
│  │                     Prisma ORM                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ Models: User, Conversation, Message, etc.               │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────┬────────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               │
                               ▼
                    ┌────────────────────┐
                    │   PostgreSQL DB    │
                    │                    │
                    │  Tables:           │
                    │  - users           │
                    │  - conversations   │
                    │  - messages        │
                    │  - participants    │
                    │  - read_receipts   │
                    └────────────────────┘
```

## Data Flow

### 1. Sending a Message (Real-time via Socket.IO)

```
User types and sends message
        │
        ▼
MessageInput component
        │
        ├─► Emit typing:start event (Socket.IO)
        │
        ▼
User clicks Send
        │
        ▼
socket.emit('message:send', {...})
        │
        ▼
Socket.IO Server receives event
        │
        ├─► Save to DB via Prisma
        │
        ├─► Broadcast to conversation room
        │   socket.to(`conversation:${id}`).emit('message:new', message)
        │
        ▼
All clients in room receive 'message:new'
        │
        ▼
MessageList component handles event
        │
        ├─► Add to Zustand store (chatStore.addMessage)
        │
        ├─► Auto-scroll to bottom
        │
        └─► Emit 'message:read' if sender ≠ currentUser
```

### 2. Fetching Conversations (HTTP)

```
Page loads
        │
        ▼
useConversations hook
        │
        ▼
GET /api/conversations
        │
        ▼
API Route checks auth (NextAuth)
        │
        ▼
Query Prisma for user's conversations
        │
        ├─► Include participants
        ├─► Include last message
        └─► Calculate unread count
        │
        ▼
Return JSON response
        │
        ▼
chatStore.setConversations(data)
        │
        ▼
ChatList component re-renders
```

### 3. Reading Messages (Real-time)

```
User opens conversation
        │
        ▼
MessageList component
        │
        ├─► socket.emit('conversation:join', conversationId)
        │
        ├─► Fetch messages: GET /api/conversations/${id}/messages
        │
        └─► For each unread message:
            socket.emit('message:read', { messageId, userId })
        │
        ▼
Socket.IO Server
        │
        ├─► Create read receipt in DB
        │
        └─► Broadcast to sender:
            socket.to(senderId).emit('message:read', {...})
        │
        ▼
Sender's client receives event
        │
        ▼
Update message with double check mark
```

### 4. Typing Indicators (Real-time)

```
User types in MessageInput
        │
        ▼
useTyping hook triggered
        │
        ▼
socket.emit('typing:start', {
  conversationId,
  userId,
  displayName
})
        │
        ▼
Socket.IO Server broadcasts to room
        │
        ▼
Other participants receive 'typing:start'
        │
        ▼
chatStore.addTypingUser(user)
        │
        ▼
TypingIndicator component shows
        │
        ▼
After 3 seconds of inactivity:
socket.emit('typing:stop', {...})
        │
        ▼
chatStore.removeTypingUser(user)
```

## Component Hierarchy

```
App
└── (main)/layout.tsx
    ├── Sidebar Navigation
    │   └── User Profile
    └── Main Content
        ├── /chats/page.tsx
        │   └── ChatList
        │       └── ChatListItem (multiple)
        │           ├── Avatar
        │           ├── Name & Last Message
        │           ├── Timestamp
        │           └── Unread Badge
        │
        └── /chats/[id]/page.tsx
            ├── ChatList (desktop only)
            └── ChatRoom
                ├── ChatHeader
                │   ├── Avatar
                │   ├── Name & Status
                │   └── Action Buttons
                ├── MessageList
                │   ├── MessageBubble (multiple)
                │   │   ├── Avatar (received only)
                │   │   ├── Message Content
                │   │   └── Timestamp & Read Receipts
                │   └── TypingIndicator (conditional)
                └── MessageInput
                    ├── Emoji Picker
                    ├── Attachment Buttons
                    ├── Text Input
                    └── Send Button
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Zustand Stores                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  chatStore                        userStore                 │
│  ┌─────────────────────┐          ┌──────────────────┐     │
│  │ State:              │          │ State:           │     │
│  │ - conversations[]   │          │ - currentUser    │     │
│  │ - messages{}        │          │ - isLoading      │     │
│  │ - currentConvId     │          │ - error          │     │
│  │ - typingUsers[]     │          └──────────────────┘     │
│  │ - isLoading         │                                    │
│  │ - error             │                                    │
│  │                     │                                    │
│  │ Actions:            │                                    │
│  │ - setConversations  │                                    │
│  │ - addMessage        │                                    │
│  │ - updateMessage     │                                    │
│  │ - deleteMessage     │                                    │
│  │ - addTypingUser     │                                    │
│  │ - markAsRead        │                                    │
│  └─────────────────────┘                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           │                              │
           │                              │
           ▼                              ▼
    Components read state         Components read state
    and dispatch actions          and dispatch actions
```

## Authentication Flow

```
User Login
    │
    ▼
NextAuth.js
    │
    ├─► Credentials Provider (email/phone/LINE ID + password)
    │   └─► bcrypt.compare(password, hash)
    │
    └─► Google OAuth Provider
    │
    ▼
JWT Token Generated
    │
    ├─► token.id = user.id
    └─► token.lineId = user.lineId
    │
    ▼
Session Created
    │
    ├─► session.user.id
    └─► session.user.lineId
    │
    ▼
Protected Routes Check Session
    │
    ├─► If authenticated: render page
    └─► If not: redirect to /login
```

## Database Schema Relationships

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────────┐            ┌────────────────┐
│ Friendship       │            │  Message       │
│ (many-to-many)   │            │  (one-to-many) │
└──────────────────┘            └────────┬───────┘
                                         │
       ┌─────────────────────────────────┤
       │                                 │
       ▼                                 ▼
┌─────────────────────┐         ┌─────────────────┐
│ ConversationPart    │         │ MessageReadReceipt│
│ (join table)        │         │ (many-to-many)  │
└──────┬──────────────┘         └─────────────────┘
       │
       ▼
┌──────────────────┐
│ Conversation     │
│                  │
│ type: DIRECT/    │
│       GROUP      │
└──────────────────┘
```

## Real-time Event Flow

```
Socket.IO Events:

Client → Server:
├─ conversation:join(conversationId)
├─ conversation:leave(conversationId)
├─ message:send(messageData)
├─ message:read(messageId, userId)
├─ typing:start(conversationId, userId, displayName)
└─ typing:stop(conversationId, userId)

Server → Client:
├─ message:new(message)           // Broadcast to room
├─ message:read(readReceipt)      // To sender
├─ typing:start(userData)         // Broadcast to room (except sender)
└─ typing:stop(userData)          // Broadcast to room (except sender)
```

## Performance Optimizations

1. **Pagination**: Messages loaded in batches of 50
2. **Virtualization**: Could be added for very long message lists
3. **Debouncing**: Typing indicators debounced (3s)
4. **Optimistic Updates**: Messages shown immediately, synced later
5. **Memoization**: React components use useMemo/useCallback where beneficial
6. **Lazy Loading**: Images loaded on demand
7. **Connection Pooling**: Prisma connection pooling for DB

## Security Measures

1. **Authentication**: NextAuth.js with JWT
2. **Authorization**: API routes check session before operations
3. **CSRF Protection**: Built into Next.js
4. **SQL Injection**: Prevented by Prisma ORM
5. **XSS Prevention**: React auto-escapes content
6. **Rate Limiting**: Can be added with @upstash/ratelimit
7. **Message Ownership**: Users can only delete own messages
8. **Conversation Access**: Verified via participant check

## Scalability Considerations

1. **Database Indexing**: Added on frequently queried fields
2. **Caching**: Can add Redis for frequently accessed data
3. **CDN**: For static assets and images
4. **Load Balancing**: Next.js supports horizontal scaling
5. **Database Sharding**: By user ID or conversation ID
6. **Message Archiving**: Move old messages to cold storage
7. **Socket.IO Adapter**: Use Redis adapter for multi-server

## Monitoring & Logging

Recommended additions:

1. **Error Tracking**: Sentry or similar
2. **Analytics**: PostHog, Mixpanel
3. **Performance**: Vercel Analytics
4. **Logs**: Winston or Pino
5. **Metrics**: Prometheus + Grafana
6. **Uptime**: UptimeRobot

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel / Cloud                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         Next.js Application                 │    │
│  │  - API Routes                               │    │
│  │  - Socket.IO Server                         │    │
│  │  - SSR Pages                                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
                       │
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐  ┌─────────┐  ┌──────────────┐
│  PostgreSQL │  │  Redis  │  │ File Storage │
│  (Supabase/ │  │ (Upstash)│  │ (S3/Upload  │
│   Railway)  │  │         │  │  Thing)      │
└─────────────┘  └─────────┘  └──────────────┘
```

This architecture provides a solid foundation for a production-ready chat application with real-time capabilities, proper state management, and excellent user experience.
