'use client';

import { MessageCircle } from 'lucide-react';

export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
      <div className="bg-white rounded-full p-6 shadow-lg mb-4">
        <MessageCircle className="w-16 h-16 text-line-green" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to LINE</h2>
      <p className="text-gray-500 text-center max-w-md">
        Select a conversation from the list to start chatting, or create a new conversation
        to connect with your friends.
      </p>
    </div>
  );
}
