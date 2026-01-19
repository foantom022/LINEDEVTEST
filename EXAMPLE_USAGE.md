# Socket.io Real-time Messaging - Example Usage

## Example 1: Basic Chat Page

Create a simple chat page using the ChatRoom component:

```tsx
// app/chat/[id]/page.tsx
'use client';

import { ChatRoom } from '@/components/chat/ChatRoom';
import { useChatStore } from '@/store/chatStore';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === params.id)
  );
  const fetchConversation = useChatStore((state) => state.fetchConversation);

  useEffect(() => {
    if (params.id && !conversation) {
      fetchConversation(params.id);
    }
  }, [params.id, conversation, fetchConversation]);

  if (!session?.user) {
    return <div>Please log in to chat</div>;
  }

  if (!conversation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen">
      <ChatRoom
        conversation={conversation}
        currentUserId={session.user.id}
      />
    </div>
  );
}
```

## Example 2: Custom Chat Implementation

Build your own chat interface with full control:

```tsx
'use client';

import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useSocketContext } from '@/components/providers/SocketProvider';
import { useChatStore } from '@/store/chatStore';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function CustomChat({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocketContext();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );

  // Track online users
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('user:online', (data) => {
      setOnlineUsers((prev) => [...prev, data.userId]);
    });

    socket.on('user:offline', (data) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    return () => {
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket, isConnected]);

  if (!session?.user || !conversation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Custom Header */}
      <div className="bg-white shadow p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {conversation.name || 'Direct Message'}
          </h1>
          <p className="text-sm text-gray-500">
            {onlineUsers.length} online
          </p>
        </div>

        {/* Connection Status Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-yellow-600">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        conversationId={conversationId}
        currentUserId={session.user.id}
      />

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        userId={session.user.id}
        displayName={session.user.name || 'User'}
      />
    </div>
  );
}
```

## Example 3: Using Socket Hooks Directly

Access socket functionality directly in any component:

```tsx
'use client';

import { useSocketContext } from '@/components/providers/SocketProvider';
import { useTyping } from '@/hooks/useTyping';
import { useEffect, useState } from 'react';

export default function ChatStatus({
  conversationId,
  userId,
  displayName,
}: {
  conversationId: string;
  userId: string;
  displayName: string;
}) {
  const { socket, isConnected } = useSocketContext();
  const [messageCount, setMessageCount] = useState(0);

  const { typingUsers, startTyping, stopTyping } = useTyping({
    conversationId,
    userId,
    displayName,
    socket,
  });

  // Count messages received
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (message: any) => {
      if (message.conversationId === conversationId) {
        setMessageCount((prev) => prev + 1);
      }
    };

    socket.on('message:new', handleMessage);

    return () => {
      socket.off('message:new', handleMessage);
    };
  }, [socket, isConnected, conversationId]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold mb-2">Chat Status</h3>

      <div className="space-y-2">
        <div>
          Status:{' '}
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div>
          Messages Received: <span className="font-mono">{messageCount}</span>
        </div>

        <div>
          Typing Users:{' '}
          {typingUsers.length > 0 ? (
            <span className="text-blue-600">
              {typingUsers.map((u) => u.userName).join(', ')}
            </span>
          ) : (
            <span className="text-gray-400">None</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Example 4: Send Messages Programmatically

Send messages from anywhere in your app:

```tsx
'use client';

import { useSocketContext } from '@/components/providers/SocketProvider';
import { useSession } from 'next-auth/react';

export default function QuickReply({ conversationId }: { conversationId: string }) {
  const { socket, isConnected } = useSocketContext();
  const { data: session } = useSession();

  const sendQuickReply = (message: string) => {
    if (!socket || !isConnected || !session?.user) {
      alert('Not connected');
      return;
    }

    socket.emit('message:send', {
      conversationId,
      senderId: session.user.id,
      content: message,
      type: 'TEXT',
    });
  };

  return (
    <div className="flex gap-2 p-4">
      <button
        onClick={() => sendQuickReply('👍')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={!isConnected}
      >
        👍
      </button>

      <button
        onClick={() => sendQuickReply('Thanks!')}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        disabled={!isConnected}
      >
        Thanks!
      </button>

      <button
        onClick={() => sendQuickReply('On my way')}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        disabled={!isConnected}
      >
        On my way
      </button>
    </div>
  );
}
```

## Example 5: Custom Typing Indicator

Create a custom typing indicator with your own UI:

```tsx
'use client';

import { useTyping, formatTypingText } from '@/hooks/useTyping';
import { useSocketContext } from '@/components/providers/SocketProvider';

export default function CustomTypingIndicator({
  conversationId,
  userId,
  displayName,
}: {
  conversationId: string;
  userId: string;
  displayName: string;
}) {
  const { socket } = useSocketContext();
  const { typingUsers, startTyping, stopTyping } = useTyping({
    conversationId,
    userId,
    displayName,
    socket,
    typingTimeout: 5000, // Custom 5 second timeout
  });

  return (
    <div className="p-2">
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          </div>
          <span>{formatTypingText(typingUsers)}</span>
        </div>
      )}
    </div>
  );
}
```

## Example 6: Monitor Connection Status

Display detailed connection information:

```tsx
'use client';

import { useSocketContext } from '@/components/providers/SocketProvider';
import { useEffect, useState } from 'react';

export default function ConnectionMonitor() {
  const { socket, isConnected } = useSocketContext();
  const [socketId, setSocketId] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);

  useEffect(() => {
    if (!socket) return;

    setSocketId(socket.id || null);

    // Ping every 5 seconds
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
        setLastPing(new Date());
      }
    }, 5000);

    socket.on('pong', () => {
      console.log('Pong received');
    });

    return () => {
      clearInterval(interval);
      socket.off('pong');
    };
  }, [socket]);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded shadow-lg max-w-xs">
      <h4 className="font-bold mb-2">Connection Info</h4>

      <div className="space-y-1 text-sm">
        <div>
          Status:{' '}
          <span
            className={`font-medium ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div>
          Socket ID:{' '}
          <span className="font-mono text-xs">{socketId || 'N/A'}</span>
        </div>

        <div>
          Last Ping:{' '}
          <span className="text-gray-600">
            {lastPing ? lastPing.toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
```

## Example 7: Listening to All Events

Debug by listening to all socket events:

```tsx
'use client';

import { useSocketContext } from '@/components/providers/SocketProvider';
import { useEffect, useState } from 'react';

export default function EventLogger() {
  const { socket, isConnected } = useSocketContext();
  const [events, setEvents] = useState<Array<{ event: string; time: Date }>>([]);

  useEffect(() => {
    if (!socket) return;

    const eventNames = [
      'message:new',
      'message:read',
      'typing:start',
      'typing:stop',
      'user:online',
      'user:offline',
      'notification:new',
    ];

    const handlers = eventNames.map((eventName) => {
      const handler = (data: any) => {
        setEvents((prev) => [
          { event: eventName, time: new Date() },
          ...prev.slice(0, 49), // Keep last 50 events
        ]);
        console.log(`[${eventName}]`, data);
      };

      socket.on(eventName, handler);
      return { eventName, handler };
    });

    return () => {
      handlers.forEach(({ eventName, handler }) => {
        socket.off(eventName, handler);
      });
    };
  }, [socket]);

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
      <h3 className="text-lg mb-2">Event Log</h3>

      {events.length === 0 ? (
        <div className="text-gray-400">No events yet...</div>
      ) : (
        <ul className="space-y-1">
          {events.map((event, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-gray-500">
                {event.time.toLocaleTimeString()}
              </span>
              <span className="text-blue-400">{event.event}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Example 8: Complete Chat Application

Full-featured chat with all Socket.io features:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocketContext } from '@/components/providers/SocketProvider';
import { useChatStore } from '@/store/chatStore';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useTyping } from '@/hooks/useTyping';

export default function FullChatApp({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocketContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );

  const participants = conversation?.participants || [];
  const otherParticipants = participants.filter(
    (p) => p.userId !== session?.user?.id
  );

  const { typingUsers } = useTyping({
    conversationId,
    userId: session?.user?.id || '',
    displayName: session?.user?.name || '',
    socket,
  });

  // Count unread messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('message:new', (message) => {
      if (
        message.conversationId === conversationId &&
        message.senderId !== session?.user?.id
      ) {
        // Increment unread if window is not focused
        if (!document.hasFocus()) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    });

    // Reset on focus
    const handleFocus = () => setUnreadCount(0);
    window.addEventListener('focus', handleFocus);

    return () => {
      socket.off('message:new');
      window.removeEventListener('focus', handleFocus);
    };
  }, [socket, isConnected, conversationId, session?.user?.id]);

  if (!session?.user || !conversation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          {/* Conversation Info */}
          <div>
            <h2 className="font-bold text-lg">
              {conversation.name || 'Direct Message'}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              {otherParticipants.map((p) => (
                <span key={p.userId} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {p.user.displayName}
                </span>
              ))}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Unread Count */}
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                {unreadCount} unread
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Typing Indicator in Header */}
        {typingUsers.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {typingUsers.map((u) => u.userName).join(', ')} typing...
          </div>
        )}
      </div>

      {/* Messages */}
      <MessageList
        conversationId={conversationId}
        currentUserId={session.user.id}
      />

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        userId={session.user.id}
        displayName={session.user.name || 'User'}
      />
    </div>
  );
}
```

## Running the Examples

1. **Install dependencies** (if needed):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Navigate to your chat page**:
   ```
   http://localhost:3000/chat/[conversation-id]
   ```

4. **Test with multiple users**:
   - Open in two browser windows
   - Log in as different users
   - Start chatting!

## Next Steps

- Explore the full documentation in `SOCKET_IO_SETUP.md`
- Read the quick start guide in `QUICKSTART.md`
- Check implementation details in `IMPLEMENTATION_SUMMARY.md`
- Build your own custom chat features!
