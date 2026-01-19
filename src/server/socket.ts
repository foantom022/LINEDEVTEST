import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';

interface SocketUser {
  userId: string;
  socketId: string;
}

interface TypingData {
  conversationId: string;
  userId: string;
  displayName: string;
}

interface MessageData {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  stickerId?: string;
  replyToId?: string;
}

interface ReadReceiptData {
  messageId: string;
  userId: string;
  conversationId: string;
}

export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/api/socket',
      addTrailingSlash: false,
    });

    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('user:register', async (userId: string) => {
        await this.registerUser(socket, userId);
      });

      // Handle typing indicators
      socket.on('typing:start', (data: TypingData) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing:stop', (data: TypingData) => {
        this.handleTypingStop(socket, data);
      });

      // Handle real-time messages
      socket.on('message:send', async (data: MessageData) => {
        await this.handleMessageSend(socket, data);
      });

      // Handle read receipts
      socket.on('message:read', async (data: ReadReceiptData) => {
        await this.handleMessageRead(socket, data);
      });

      // Handle joining conversation rooms
      socket.on('conversation:join', (conversationId: string) => {
        this.handleConversationJoin(socket, conversationId);
      });

      socket.on('conversation:leave', (conversationId: string) => {
        this.handleConversationLeave(socket, conversationId);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async registerUser(socket: Socket, userId: string) {
    try {
      // Store socket mapping
      this.socketUsers.set(socket.id, userId);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(socket.id);

      // Update user online status in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Get all conversations the user is part of
      const conversations = await prisma.conversationParticipant.findMany({
        where: {
          userId,
          leftAt: null,
        },
        select: { conversationId: true },
      });

      // Join all conversation rooms
      conversations.forEach((conv) => {
        socket.join(`conversation:${conv.conversationId}`);
      });

      // Notify friends that user is online
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { friendId: userId, status: 'ACCEPTED' },
          ],
        },
        select: {
          userId: true,
          friendId: true,
        },
      });

      const friendIds = friendships.map((f) =>
        f.userId === userId ? f.friendId : f.userId
      );

      friendIds.forEach((friendId) => {
        this.io.to(`user:${friendId}`).emit('user:online', {
          userId,
          isOnline: true,
        });
      });

      console.log(`User registered: ${userId} on socket ${socket.id}`);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  }

  private handleTypingStart(socket: Socket, data: TypingData) {
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: data.userId,
      displayName: data.displayName,
    });
  }

  private handleTypingStop(socket: Socket, data: TypingData) {
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
  }

  private async handleMessageSend(socket: Socket, data: MessageData) {
    try {
      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: (data.type as any) || 'TEXT',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          stickerId: data.stickerId,
          replyToId: data.replyToId,
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              profileImage: true,
              lineId: true,
            },
          },
          replyTo: {
            include: {
              sender: {
                select: {
                  id: true,
                  displayName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      });

      // Emit message to all participants in the conversation
      this.io.to(`conversation:${data.conversationId}`).emit('message:new', message);

      // Get all participants to send notifications
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId: data.conversationId,
          userId: { not: data.senderId },
          leftAt: null,
        },
        select: {
          userId: true,
          user: {
            select: {
              displayName: true,
            },
          },
        },
      });

      // Send push notifications to offline users
      participants.forEach((participant) => {
        this.io.to(`user:${participant.userId}`).emit('notification:new', {
          type: 'MESSAGE',
          messageId: message.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
        });
      });

      console.log(`Message sent in conversation ${data.conversationId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  }

  private async handleMessageRead(socket: Socket, data: ReadReceiptData) {
    try {
      // Create or update read receipt
      const readReceipt = await prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: data.messageId,
            userId: data.userId,
          },
        },
        create: {
          messageId: data.messageId,
          userId: data.userId,
        },
        update: {
          readAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              profileImage: true,
            },
          },
        },
      });

      // Emit read receipt to all participants in the conversation
      this.io.to(`conversation:${data.conversationId}`).emit('message:read', {
        messageId: data.messageId,
        userId: data.userId,
        readAt: readReceipt.readAt,
        user: readReceipt.user,
      });

      console.log(`Message ${data.messageId} read by user ${data.userId}`);
    } catch (error) {
      console.error('Error handling read receipt:', error);
    }
  }

  private handleConversationJoin(socket: Socket, conversationId: string) {
    socket.join(`conversation:${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  }

  private handleConversationLeave(socket: Socket, conversationId: string) {
    socket.leave(`conversation:${conversationId}`);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  }

  private async handleDisconnect(socket: Socket) {
    const userId = this.socketUsers.get(socket.id);

    if (userId) {
      // Remove socket from user's socket set
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);

        // If user has no more active sockets, set them offline
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);

          try {
            // Update user offline status in database
            await prisma.user.update({
              where: { id: userId },
              data: {
                isOnline: false,
                lastSeen: new Date(),
              },
            });

            // Notify friends that user is offline
            const friendships = await prisma.friendship.findMany({
              where: {
                OR: [
                  { userId, status: 'ACCEPTED' },
                  { friendId: userId, status: 'ACCEPTED' },
                ],
              },
              select: {
                userId: true,
                friendId: true,
              },
            });

            const friendIds = friendships.map((f) =>
              f.userId === userId ? f.friendId : f.userId
            );

            friendIds.forEach((friendId) => {
              this.io.to(`user:${friendId}`).emit('user:offline', {
                userId,
                isOnline: false,
                lastSeen: new Date(),
              });
            });

            console.log(`User ${userId} is now offline`);
          } catch (error) {
            console.error('Error updating user offline status:', error);
          }
        }
      }

      this.socketUsers.delete(socket.id);
    }

    console.log(`Socket disconnected: ${socket.id}`);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

let socketService: SocketService | null = null;

export function initializeSocket(server: HTTPServer): SocketService {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
}

export function getSocketService(): SocketService | null {
  return socketService;
}
