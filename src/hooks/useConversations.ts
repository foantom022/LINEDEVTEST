import { useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';

export function useConversations() {
  const {
    conversations,
    setConversations,
    setLoading,
    setError,
    addConversation,
    updateConversation,
  } = useChatStore();

  const { currentUser } = useUserStore();

  const fetchConversations = useCallback(async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/conversations');

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, setConversations, setLoading, setError]);

  const createConversation = useCallback(
    async (participantIds: string[], type: 'DIRECT' | 'GROUP', name?: string) => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantIds,
            type,
            name,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create conversation');
        }

        const data = await response.json();
        addConversation(data.conversation);
        return data.conversation;
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error creating conversation:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, addConversation, setLoading, setError]
  );

  const updateConversationDetails = useCallback(
    async (conversationId: string, updates: { name?: string; imageUrl?: string }) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update conversation');
        }

        const data = await response.json();
        updateConversation(conversationId, data.conversation);
        return data.conversation;
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error updating conversation:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [updateConversation, setLoading, setError]
  );

  useEffect(() => {
    if (currentUser && conversations.length === 0) {
      fetchConversations();
    }
  }, [currentUser]);

  return {
    conversations,
    fetchConversations,
    createConversation,
    updateConversationDetails,
  };
}
