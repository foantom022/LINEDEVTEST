import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        lineId: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        profileImage: true,
        coverImage: true,
        statusMessage: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/auth/me - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, profileImage, coverImage, statusMessage } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(profileImage !== undefined && { profileImage }),
        ...(coverImage !== undefined && { coverImage }),
        ...(statusMessage !== undefined && { statusMessage }),
      },
      select: {
        id: true,
        lineId: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        profileImage: true,
        coverImage: true,
        statusMessage: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
