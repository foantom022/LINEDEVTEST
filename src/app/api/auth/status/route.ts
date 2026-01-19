import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/auth/status - Update online status
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'isOnline must be a boolean' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
