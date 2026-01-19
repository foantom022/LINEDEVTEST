'use client';

export function TypingIndicator({ userName }: { userName?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm w-fit">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      </div>
      {userName && (
        <span className="text-sm text-gray-500">{userName} is typing...</span>
      )}
    </div>
  );
}
