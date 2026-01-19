import { create } from 'zustand';

export interface CurrentUser {
  id: string;
  lineId: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName: string;
  profileImage?: string | null;
  coverImage?: string | null;
  statusMessage?: string | null;
  isOnline: boolean;
  lastSeen: string | Date;
  createdAt: string | Date;
}

interface UserStore {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentUser: (user: CurrentUser | null) => void;
  updateCurrentUser: (updates: Partial<CurrentUser>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, ...updates }
        : null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setOnlineStatus: (isOnline) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, isOnline, lastSeen: new Date().toISOString() }
        : null,
    })),
}));
