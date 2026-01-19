import { useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';

export function useCurrentUser() {
  const { currentUser, setCurrentUser, setLoading, setError, updateCurrentUser } =
    useUserStore();

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        if (response.status === 401) {
          setCurrentUser(null);
          return;
        }
        throw new Error('Failed to fetch current user');
      }

      const data = await response.json();
      setCurrentUser(data.user);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching current user:', error);
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser, setLoading, setError]);

  const updateProfile = useCallback(
    async (updates: {
      displayName?: string;
      profileImage?: string;
      coverImage?: string;
      statusMessage?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        const data = await response.json();
        updateCurrentUser(data.user);
        return data.user;
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error updating profile:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [updateCurrentUser, setLoading, setError]
  );

  const setOnlineStatus = useCallback(
    async (isOnline: boolean) => {
      try {
        const response = await fetch('/api/auth/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isOnline }),
        });

        if (!response.ok) {
          throw new Error('Failed to update online status');
        }

        updateCurrentUser({ isOnline, lastSeen: new Date().toISOString() });
      } catch (err) {
        console.error('Error updating online status:', err);
      }
    },
    [updateCurrentUser]
  );

  useEffect(() => {
    fetchCurrentUser();

    // Set online status when component mounts
    setOnlineStatus(true);

    // Set offline status when page unloads
    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOnlineStatus(false);
    };
  }, []);

  return {
    currentUser,
    fetchCurrentUser,
    updateProfile,
    setOnlineStatus,
  };
}
