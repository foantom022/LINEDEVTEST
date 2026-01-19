import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations/[id]/messages - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = params.id;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // message ID to fetch messages before

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        NOT: {
          deletedFor: {
            has: userId,
          },
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            isOnline: true,
          },
        },
        replyTo: {
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
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      ...(before && {
        cursor: {
          id: before,
        },
        skip: 1,
      }),
    });

    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Reverse to get chronological order
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = params.id;
    const body = await request.json();
    const {
      content,
      type = 'TEXT',
      fileUrl,
      fileName,
      fileSize,
      stickerId,
      replyToId,
    } = body;

    // Validate content
    if (!content && !fileUrl && !stickerId) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        stickerId,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            isOnline: true,
          },
        },
        replyTo: {
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

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create read receipt for sender
    await prisma.messageReadReceipt.create({
      data: {
        messageId: message.id,
        userId,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
