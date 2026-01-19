import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations/[id] - Get a single conversation
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation
export async function PATCH(
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
    const { name, imageUrl } = body;

    // Check if user is an admin participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        role: 'ADMIN',
        leftAt: null,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Only admins can update conversation details' },
        { status: 403 }
      );
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: name !== undefined ? name : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
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

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
