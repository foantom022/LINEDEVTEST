# LINE Chat Application

เว็บแชทแบบ LINE ที่สร้างด้วย Next.js และ PostgreSQL มีฟีเจอร์ครบถ้วนเหมือนแอพ LINE จริง

## 🚀 Features

### Core Features
- ✅ **Authentication** - สมัครสมาชิก/เข้าสู่ระบบ (Email, Phone, Google)
- ✅ **User Profile** - โปรไฟล์ผู้ใช้ รูปโปรไฟล์ สถานะ
- ✅ **Friend System** - เพิ่มเพื่อน บล็อก รายการเพื่อน
- ✅ **One-on-One Chat** - แชทส่วนตัว 1:1
- ✅ **Group Chat** - สร้างกลุ่ม เพิ่ม/ลบสมาชิก
- ✅ **Real-time Messaging** - ส่งข้อความแบบเรียลไทม์
- ✅ **Media Sharing** - รูปภาพ วิดีโอ ไฟล์
- ✅ **Stickers** - สติ๊กเกอร์
- ✅ **Voice Messages** - ข้อความเสียง
- ✅ **Read Receipts** - อ่านแล้ว
- ✅ **Typing Indicator** - กำลังพิมพ์
- ✅ **Timeline/Posts** - โพสต์สถานะ
- ✅ **Voice/Video Calls** - โทรเสียงและวิดีโอ
- ✅ **Notifications** - แจ้งเตือน

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.io
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS + shadcn/ui
- **File Upload**: UploadThing
- **State Management**: Zustand
- **Validation**: Zod
- **Date Handling**: date-fns

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LINEDEVTEST
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/linedevtest"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # UploadThing
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"

   # Upstash Redis
   UPSTASH_REDIS_REST_URL="your-redis-url"
   UPSTASH_REDIS_REST_TOKEN="your-redis-token"
   ```

4. **Set up database**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or run migrations
   npm run db:migrate

   # Open Prisma Studio (optional)
   npm run db:studio
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
linedevtest/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (main)/           # Main app pages
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── chat/            # Chat components
│   │   ├── friends/         # Friend components
│   │   └── timeline/        # Timeline components
│   ├── lib/                 # Utilities
│   │   ├── prisma.ts        # Prisma client
│   │   ├── auth.ts          # Auth config
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   └── server/              # Server utilities
├── public/                  # Static files
└── package.json
```

## 🗄️ Database Schema

### Main Tables
- **users** - ข้อมูลผู้ใช้
- **friendships** - ความสัมพันธ์เพื่อน
- **conversations** - บทสนทนา (1:1 และกลุ่ม)
- **conversation_participants** - สมาชิกในบทสนทนา
- **messages** - ข้อความ
- **message_read_receipts** - การอ่านข้อความ
- **sticker_packs** - ชุดสติ๊กเกอร์
- **stickers** - สติ๊กเกอร์
- **posts** - โพสต์ในไทม์ไลน์
- **post_likes** - การกดถูกใจ
- **post_comments** - คอมเมนต์
- **calls** - การโทร
- **notifications** - การแจ้งเตือน

## 🔌 API Routes

### Authentication
- `POST /api/auth/signup` - สมัครสมาชิก
- `POST /api/auth/signin` - เข้าสู่ระบบ

### Users
- `GET /api/users/me` - ดึงข้อมูลตัวเอง
- `PATCH /api/users/me` - แก้ไขโปรไฟล์
- `GET /api/users/:id` - ดึงข้อมูลผู้ใช้

### Friends
- `GET /api/friends` - รายชื่อเพื่อน
- `POST /api/friends/request` - ส่งคำขอเป็นเพื่อน
- `POST /api/friends/accept` - ยอมรับคำขอ
- `DELETE /api/friends/:id` - ลบเพื่อน

### Conversations
- `GET /api/conversations` - รายการแชท
- `POST /api/conversations` - สร้างแชทใหม่
- `GET /api/conversations/:id` - ดึงข้อมูลแชท

### Messages
- `GET /api/conversations/:id/messages` - ดึงข้อความ
- `POST /api/conversations/:id/messages` - ส่งข้อความ
- `DELETE /api/messages/:id` - ลบข้อความ

## 🔐 Security

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Rate limiting with Upstash
- ✅ Input validation with Zod
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection
- ✅ CSRF protection

## 🚀 Deployment

### Database
- **Railway** - Recommended for PostgreSQL
- **Neon** - Serverless PostgreSQL
- **Supabase** - PostgreSQL with additional features

### Hosting
- **Vercel** - Best for Next.js (auto-scaling)
- **Railway** - Full-stack hosting

### File Storage
- **UploadThing** - Easy setup for Next.js
- **AWS S3** - Production-grade storage
- **Cloudinary** - Image optimization

### Steps
1. Push database schema
   ```bash
   npm run db:push
   ```

2. Build the application
   ```bash
   npm run build
   ```

3. Deploy to Vercel
   ```bash
   vercel deploy --prod
   ```

## 📝 Scripts

```bash
npm run dev          # Run development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js & PostgreSQL**
