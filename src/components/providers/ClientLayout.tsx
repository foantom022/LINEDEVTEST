'use client';

import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from './SocketProvider';
import { useSession } from 'next-auth/react';

function SocketWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return <SocketProvider userId={userId}>{children}</SocketProvider>;
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketWrapper>{children}</SocketWrapper>
    </SessionProvider>
  );
}
