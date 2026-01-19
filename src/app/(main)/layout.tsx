'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Home, MessageCircle, Users, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Chats', href: '/chats', icon: MessageCircle },
  { name: 'Friends', href: '/friends', icon: Users },
  { name: 'Timeline', href: '/timeline', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-20 bg-line-green">
        <div className="flex-1 flex flex-col items-center py-6 space-y-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-lg"
          >
            <MessageCircle className="w-6 h-6 text-line-green" />
          </Link>

          {/* Navigation */}
          <nav className="flex flex-col items-center space-y-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
                    isActive
                      ? 'bg-white text-line-green'
                      : 'text-white hover:bg-white/20'
                  )}
                  title={item.name}
                >
                  <item.icon className="w-6 h-6" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4">
          <Link
            href="/profile"
            className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 border-white hover:border-line-gray transition-colors"
          >
            {currentUser.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={currentUser.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center text-line-green font-bold">
                {currentUser.displayName[0].toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full space-y-1',
                  isActive ? 'text-line-green' : 'text-gray-400'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
