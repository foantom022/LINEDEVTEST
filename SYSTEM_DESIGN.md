# LINE-Style Chat Application - System Design

## Project Overview
เว็บแชทแบบ LINE ที่มีฟีเจอร์ครบถ้วนเหมือนแอพ LINE จริง

**Tech Stack:**
- **Frontend**: Next.js 15 (App Router) + React 19
- **Backend**: Next.js API Routes + Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Auth**: NextAuth.js v5
- **File Storage**: UploadThing / AWS S3
- **Deployment**: Vercel (Frontend) + Railway/Render (Database)

---

## Core Features (LINE-Compatible)

### 1. User Management
- ✅ สมัครสมาชิก/เข้าสู่ระบบ (Email, Phone, Google, Line Login)
- ✅ โปรไฟล์ผู้ใช้ (รูปโปรไฟล์, ชื่อ, สถานะ, Cover Photo)
- ✅ QR Code สำหรับเพิ่มเพื่อน
- ✅ LINE ID (username ที่ไม่ซ้ำกัน)

### 2. Friend System
- ✅ เพิ่มเพื่อนด้วย LINE ID, QR Code, เบอร์โทร
- ✅ คำขอเป็นเพื่อน (Friend Request)
- ✅ บล็อกผู้ใช้
- ✅ รายชื่อเพื่อน (เรียงตามตัวอักษร)
- ✅ Favorites (เพื่อนสนิท)

### 3. One-on-One Chat
- ✅ ส่งข้อความข้อความ
- ✅ ส่งรูปภาพ, วิดีโอ
- ✅ ส่งไฟล์
- ✅ ส่งสติ๊กเกอร์
- ✅ Voice Messages
- ✅ ส่งตำแหน่ง (Location)
- ✅ อ่านแล้ว (Read Receipts)
- ✅ Typing Indicator
- ✅ Reply (ตอบกลับข้อความ)
- ✅ Forward (ส่งต่อข้อความ)
- ✅ ลบข้อความ (Delete for me / Delete for everyone)
- ✅ Pin ข้อความสำคัญ

### 4. Group Chat
- ✅ สร้างกลุ่ม
- ✅ เพิ่ม/ลบสมาชิก
- ✅ รูปกลุ่ม, ชื่อกลุ่ม
- ✅ Admin/Member roles
- ✅ ออกจากกลุ่ม
- ✅ Mentions (@username)
- ✅ Group announcements

### 5. Timeline/Posts (ไทม์ไลน์)
- ✅ โพสต์สถานะ, รูปภาพ
- ✅ กดถูกใจ, คอมเมนต์
- ✅ แชร์โพสต์
- ✅ เฉพาะเพื่อน/สาธารณะ

### 6. Voice/Video Call
- ✅ โทรเสียง 1:1
- ✅ วิดีโอคอล 1:1
- ✅ กลุ่ม Voice/Video Call

### 7. Additional Features
- ✅ Stickers Store
- ✅ Themes (ธีมสี)
- ✅ Notifications (แจ้งเตือน)
- ✅ Search (ค้นหาข้อความ, คน, กลุ่ม)
- ✅ Album (อัลบั้มรูปภาพในแชท)
- ✅ Keep (บันทึกข้อความสำคัญ)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │  Socket.io   │  │    React     │      │
│  │  App Router  │  │    Client    │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server (Vercel)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Routes  │  │  Server      │  │   NextAuth   │      │
│  │   (REST)     │  │  Components  │  │     v5       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Socket.io   │  │  PostgreSQL  │  │ UploadThing/ │
│    Server    │  │    (Prisma)  │  │     S3       │
│              │  │              │  │              │
│  Real-time   │  │  Data Store  │  │ File Storage │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐
│    Redis     │
│  (Optional)  │
│   Pub/Sub    │
└──────────────┘
```

---

## Database Schema Design

### Core Tables

#### 1. users
```sql
- id (UUID, PK)
- lineId (String, Unique) -- LINE ID สำหรับเพิ่มเพื่อน
- email (String, Unique)
- phoneNumber (String, Unique, Optional)
- passwordHash (String)
- displayName (String)
- profileImage (String, URL)
- coverImage (String, URL)
- statusMessage (String)
- qrCode (String) -- QR Code data
- isOnline (Boolean)
- lastSeen (DateTime)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### 2. friendships
```sql
- id (UUID, PK)
- userId (UUID, FK -> users)
- friendId (UUID, FK -> users)
- status (Enum: PENDING, ACCEPTED, BLOCKED)
- isFavorite (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
- UNIQUE(userId, friendId)
```

#### 3. conversations
```sql
- id (UUID, PK)
- type (Enum: DIRECT, GROUP)
- name (String, nullable) -- สำหรับกลุ่ม
- imageUrl (String, nullable) -- รูปกลุ่ม
- createdById (UUID, FK -> users)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### 4. conversation_participants
```sql
- id (UUID, PK)
- conversationId (UUID, FK -> conversations)
- userId (UUID, FK -> users)
- role (Enum: ADMIN, MEMBER) -- สำหรับกลุ่ม
- joinedAt (DateTime)
- lastReadAt (DateTime) -- อ่านถึงไหนแล้ว
- isMuted (Boolean)
- isPinned (Boolean)
- UNIQUE(conversationId, userId)
```

#### 5. messages
```sql
- id (UUID, PK)
- conversationId (UUID, FK -> conversations)
- senderId (UUID, FK -> users)
- content (Text)
- type (Enum: TEXT, IMAGE, VIDEO, FILE, STICKER, VOICE, LOCATION)
- fileUrl (String, nullable)
- fileName (String, nullable)
- fileSize (Int, nullable)
- replyToId (UUID, FK -> messages, nullable)
- isDeleted (Boolean)
- deletedFor (JSON) -- [userId] ที่ลบข้อความนี้
- isPinned (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### 6. message_read_receipts
```sql
- id (UUID, PK)
- messageId (UUID, FK -> messages)
- userId (UUID, FK -> users)
- readAt (DateTime)
- UNIQUE(messageId, userId)
```

#### 7. stickers
```sql
- id (UUID, PK)
- packId (UUID, FK -> sticker_packs)
- imageUrl (String)
- order (Int)
- createdAt (DateTime)
```

#### 8. sticker_packs
```sql
- id (UUID, PK)
- name (String)
- description (Text)
- coverImage (String)
- price (Decimal) -- 0 = ฟรี
- createdAt (DateTime)
```

#### 9. user_sticker_packs
```sql
- id (UUID, PK)
- userId (UUID, FK -> users)
- packId (UUID, FK -> sticker_packs)
- purchasedAt (DateTime)
- UNIQUE(userId, packId)
```

#### 10. posts (Timeline)
```sql
- id (UUID, PK)
- userId (UUID, FK -> users)
- content (Text)
- imageUrls (JSON) -- Array of image URLs
- visibility (Enum: PUBLIC, FRIENDS, PRIVATE)
- likesCount (Int)
- commentsCount (Int)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### 11. post_likes
```sql
- id (UUID, PK)
- postId (UUID, FK -> posts)
- userId (UUID, FK -> users)
- createdAt (DateTime)
- UNIQUE(postId, userId)
```

#### 12. post_comments
```sql
- id (UUID, PK)
- postId (UUID, FK -> posts)
- userId (UUID, FK -> users)
- content (Text)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### 13. calls
```sql
- id (UUID, PK)
- conversationId (UUID, FK -> conversations)
- initiatorId (UUID, FK -> users)
- type (Enum: VOICE, VIDEO)
- status (Enum: CALLING, ONGOING, ENDED, MISSED)
- startedAt (DateTime)
- endedAt (DateTime, nullable)
- duration (Int) -- seconds
```

#### 14. call_participants
```sql
- id (UUID, PK)
- callId (UUID, FK -> calls)
- userId (UUID, FK -> users)
- joinedAt (DateTime)
- leftAt (DateTime, nullable)
```

#### 15. notifications
```sql
- id (UUID, PK)
- userId (UUID, FK -> users)
- type (Enum: MESSAGE, FRIEND_REQUEST, POST_LIKE, etc.)
- title (String)
- content (Text)
- isRead (Boolean)
- relatedId (UUID) -- ID ของสิ่งที่เกี่ยวข้อง
- relatedType (String) -- ประเภทของสิ่งที่เกี่ยวข้อง
- createdAt (DateTime)
```

---

## API Design

### Authentication
```
POST   /api/auth/signup          - สมัครสมาชิก
POST   /api/auth/signin          - เข้าสู่ระบบ
POST   /api/auth/signout         - ออกจากระบบ
GET    /api/auth/session         - ดึงข้อมูล session
POST   /api/auth/verify-otp      - ยืนยัน OTP
```

### Users
```
GET    /api/users/me             - ดึงข้อมูลตัวเอง
PATCH  /api/users/me             - แก้ไขโปรไฟล์
GET    /api/users/:id            - ดึงข้อมูลผู้ใช้
POST   /api/users/search         - ค้นหาผู้ใช้
GET    /api/users/qr-code        - สร้าง QR Code
```

### Friends
```
GET    /api/friends              - รายชื่อเพื่อน
POST   /api/friends/request      - ส่งคำขอเป็นเพื่อน
POST   /api/friends/accept       - ยอมรับคำขอ
POST   /api/friends/reject       - ปฏิเสธคำขอ
DELETE /api/friends/:id          - ลบเพื่อน
POST   /api/friends/:id/block    - บล็อก
POST   /api/friends/:id/favorite - เพิ่ม/ลบรายการโปรด
```

### Conversations
```
GET    /api/conversations        - รายการแชททั้งหมด
POST   /api/conversations        - สร้างแชทใหม่
GET    /api/conversations/:id    - ดึงข้อมูลแชท
PATCH  /api/conversations/:id    - แก้ไขแชท
DELETE /api/conversations/:id    - ลบแชท
POST   /api/conversations/:id/leave - ออกจากกลุ่ม
```

### Messages
```
GET    /api/conversations/:id/messages       - ดึงข้อความ (pagination)
POST   /api/conversations/:id/messages       - ส่งข้อความ
PATCH  /api/messages/:id                     - แก้ไขข้อความ
DELETE /api/messages/:id                     - ลบข้อความ
POST   /api/messages/:id/read                - ทำเครื่องหมายอ่านแล้ว
POST   /api/messages/:id/pin                 - ปักหมุดข้อความ
```

### Stickers
```
GET    /api/stickers/packs       - รายการสติ๊กเกอร์แพค
GET    /api/stickers/packs/:id   - ดึงสติ๊กเกอร์ในแพค
POST   /api/stickers/packs/:id/purchase - ซื้อสติ๊กเกอร์แพค
GET    /api/stickers/my-packs    - สติ๊กเกอร์แพคของฉัน
```

### Posts (Timeline)
```
GET    /api/posts                - ดึงโพสต์ทั้งหมด (feed)
POST   /api/posts                - สร้างโพสต์
GET    /api/posts/:id            - ดึงโพสต์
PATCH  /api/posts/:id            - แก้ไขโพสต์
DELETE /api/posts/:id            - ลบโพสต์
POST   /api/posts/:id/like       - กดถูกใจ
GET    /api/posts/:id/comments   - ดึงคอมเมนต์
POST   /api/posts/:id/comments   - สร้างคอมเมนต์
```

### Calls
```
POST   /api/calls                - เริ่มต้นการโทร
POST   /api/calls/:id/join       - เข้าร่วมการโทร
POST   /api/calls/:id/leave      - ออกจากการโทร
GET    /api/calls/:id            - ดึงข้อมูลการโทร
```

### Notifications
```
GET    /api/notifications        - รายการแจ้งเตือน
PATCH  /api/notifications/:id/read - ทำเครื่องหมายอ่านแล้ว
PATCH  /api/notifications/read-all  - อ่านทั้งหมด
```

### File Upload
```
POST   /api/upload/image         - อัปโหลดรูปภาพ
POST   /api/upload/video         - อัปโหลดวิดีโอ
POST   /api/upload/file          - อัปโหลดไฟล์
POST   /api/upload/voice         - อัปโหลดเสียง
```

---

## Socket.io Events

### Client -> Server
```javascript
// Connection
socket.emit('user:online', { userId })
socket.emit('user:offline', { userId })

// Typing
socket.emit('typing:start', { conversationId, userId })
socket.emit('typing:stop', { conversationId, userId })

// Messages
socket.emit('message:send', { conversationId, message })
socket.emit('message:read', { messageId, userId })

// Calls
socket.emit('call:initiate', { conversationId, callType })
socket.emit('call:join', { callId })
socket.emit('call:leave', { callId })
socket.emit('call:signal', { to, signal }) // WebRTC signaling
```

### Server -> Client
```javascript
// Online Status
socket.on('user:online', { userId })
socket.on('user:offline', { userId })

// Typing
socket.on('typing:start', { conversationId, userId })
socket.on('typing:stop', { conversationId, userId })

// Messages
socket.on('message:new', { conversationId, message })
socket.on('message:updated', { messageId, updates })
socket.on('message:deleted', { messageId })
socket.on('message:read', { messageId, userId, readAt })

// Calls
socket.on('call:incoming', { call })
socket.on('call:joined', { callId, userId })
socket.on('call:left', { callId, userId })
socket.on('call:ended', { callId })
socket.on('call:signal', { from, signal }) // WebRTC signaling

// Notifications
socket.on('notification:new', { notification })
```

---

## File Structure

```
linedevtest/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/
│   │   │   ├── chats/
│   │   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── friends/
│   │   │   ├── timeline/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── friends/
│   │   │   ├── conversations/
│   │   │   ├── messages/
│   │   │   ├── stickers/
│   │   │   ├── posts/
│   │   │   ├── calls/
│   │   │   ├── notifications/
│   │   │   └── upload/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn/ui)
│   │   ├── chat/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatRoom.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── friends/
│   │   │   ├── FriendList.tsx
│   │   │   ├── FriendRequest.tsx
│   │   │   └── AddFriend.tsx
│   │   ├── timeline/
│   │   │   ├── Post.tsx
│   │   │   ├── PostComposer.tsx
│   │   │   └── Comment.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── Navbar.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── socket.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useMessages.ts
│   │   ├── useConversations.ts
│   │   └── useFriends.ts
│   ├── store/
│   │   ├── userStore.ts
│   │   ├── chatStore.ts
│   │   └── notificationStore.ts
│   ├── types/
│   │   └── index.ts
│   └── server/
│       └── socket.ts (Socket.io server)
├── public/
│   ├── stickers/
│   └── images/
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Security Considerations

### 1. Authentication
- ใช้ NextAuth.js v5 with JWT
- Hash passwords ด้วย bcrypt (12 rounds)
- Implement rate limiting สำหรับ login
- OTP verification สำหรับเบอร์โทร

### 2. Authorization
- Verify ownership ก่อนทุก CRUD operation
- Check conversation membership
- Validate file upload permissions

### 3. Data Protection
- ไม่แชร์ข้อมูลส่วนตัว (email, phone) โดยไม่ได้รับอนุญาต
- Sanitize user inputs
- XSS protection
- SQL injection protection (Prisma handles this)

### 4. File Upload
- File type validation
- File size limits (Images: 10MB, Videos: 100MB, Files: 50MB)
- Virus scanning (optional)
- Use signed URLs for private files

### 5. Rate Limiting
- Message sending: 10/min per user
- Friend requests: 5/min
- API calls: 100/min per user

### 6. WebSocket Security
- Authenticate socket connections
- Validate room membership before joining
- Implement message validation

---

## Performance Optimization

### 1. Database
- Index on frequently queried fields
- Use database-level full-text search
- Implement pagination
- Use connection pooling

### 2. Caching
- Redis for online status
- Cache conversation lists
- Cache user profiles
- CDN for static assets

### 3. Real-time
- Socket.io rooms for conversations
- Only send updates to relevant users
- Debounce typing indicators

### 4. Frontend
- Next.js Image optimization
- Code splitting
- Lazy load components
- Virtual scrolling for long lists
- Optimize bundle size

### 5. File Storage
- CDN for images/files
- Image compression
- Video transcoding
- Lazy loading images

---

## Deployment Strategy

### Development
```
- Local PostgreSQL
- Local Socket.io server
- Local file storage
```

### Staging
```
- Railway/Render PostgreSQL
- Vercel deployment
- UploadThing for files
```

### Production
```
- Managed PostgreSQL (Railway/Neon/Supabase)
- Vercel (auto-scaling)
- AWS S3 + CloudFront
- Redis (Upstash)
- Monitoring: Sentry
```

---

## Next Steps

1. ✅ Initialize Next.js project
2. ✅ Set up Prisma with PostgreSQL
3. ✅ Implement authentication
4. ✅ Build basic chat functionality
5. ✅ Add real-time features
6. ✅ Implement friend system
7. ✅ Add group chat
8. ✅ Build Timeline feature
9. ✅ Implement calls (WebRTC)
10. ✅ Polish UI/UX

---

**Estimated Development Time:**
- Phase 1 (Core Chat): 2-3 weeks
- Phase 2 (Friends/Groups): 1-2 weeks
- Phase 3 (Timeline): 1 week
- Phase 4 (Calls): 1-2 weeks
- Phase 5 (Polish): 1 week

**Total: 6-9 weeks for full implementation**
