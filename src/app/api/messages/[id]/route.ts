import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const messageId = params.id;

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Soft delete by marking as deleted for this user
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedFor: {
          push: userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/[id] - Update a message (edit or pin)
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
    const messageId = params.id;
    const body = await request.json();
    const { content, isPinned } = body;

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // For content editing, user must be the sender
    if (content !== undefined && message.senderId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // For pinning, user must be a participant
    if (isPinned !== undefined) {
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: message.conversationId,
          userId,
          leftAt: null,
        },
      });

      if (!participant) {
        return NextResponse.json(
          { error: 'You are not a participant in this conversation' },
          { status: 403 }
        );
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        ...(content !== undefined && { content }),
        ...(isPinned !== undefined && { isPinned }),
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
      },
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
