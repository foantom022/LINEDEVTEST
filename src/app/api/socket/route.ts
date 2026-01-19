import { NextRequest, NextResponse } from 'next/server';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// This will be populated by the custom server
let io: SocketIOServer | undefined;

export async function GET(req: NextRequest) {
  if (!io) {
    return NextResponse.json(
      { error: 'Socket.io not initialized' },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'Socket.io is running' });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
