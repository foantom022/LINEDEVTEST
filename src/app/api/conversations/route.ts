import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all conversations where user is a participant
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        leftAt: null, // Only active participants
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                leftAt: null,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    profileImage: true,
                    isOnline: true,
                    lastSeen: true,
                  },
                },
              },
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    displayName: true,
                    profileImage: true,
                    isOnline: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    const conversations = participants.map((p) => {
      const conversation = p.conversation;
      const lastMessage = conversation.messages[0] || null;

      // Calculate unread count
      const unreadCount = p.lastReadAt
        ? conversation.messages.filter(
            (msg: any) =>
              msg.senderId !== userId &&
              new Date(msg.createdAt) > new Date(p.lastReadAt!)
          ).length
        : 0;

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        imageUrl: conversation.imageUrl,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        participants: conversation.participants.map((participant) => ({
          id: participant.id,
          userId: participant.userId,
          role: participant.role,
          lastReadAt: participant.lastReadAt,
          isMuted: participant.isMuted,
          isPinned: participant.isPinned,
          user: participant.user,
        })),
        lastMessage,
        unreadCount,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { participantIds, type, name } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'Participant IDs are required' },
        { status: 400 }
      );
    }

    if (!type || !['DIRECT', 'GROUP'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid conversation type' },
        { status: 400 }
      );
    }

    // For direct conversations, check if one already exists
    if (type === 'DIRECT') {
      if (participantIds.length !== 1) {
        return NextResponse.json(
          { error: 'Direct conversation must have exactly 1 other participant' },
          { status: 400 }
        );
      }

      // Find existing direct conversation
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [userId, participantIds[0]],
              },
              leftAt: null,
            },
          },
        },
        include: {
          participants: {
            where: {
              leftAt: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  profileImage: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  displayName: true,
                  profileImage: true,
                  isOnline: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return NextResponse.json({ conversation: existingConversation });
      }
    }

    // Create new conversation
    const allParticipantIds = [userId, ...participantIds];

    const conversation = await prisma.conversation.create({
      data: {
        type,
        name: type === 'GROUP' ? name : null,
        createdById: userId,
        participants: {
          create: allParticipantIds.map((id, index) => ({
            userId: id,
            role: id === userId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                profileImage: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
