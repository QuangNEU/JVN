import { create } from 'zustand';
import { Account } from '@/features/accounts/types/account';
import axiosClient from '@/services/axios';

interface AuthState {
    user: Account | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setAuth: (user: Account) => void;
    restoreSession: () => Promise<void>
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: (user,) =>
        set({ user, isAuthenticated: true, isLoading: false }),

    restoreSession: async () => {
        try {
            const mesResponse = await axiosClient.get("/accounts/me")
            set({
                user: mesResponse.data,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
    logout: async () => {
        try {
            await axiosClient.post("/auth/logout");
        }
        finally {
            set({ user: null, isAuthenticated: false, isLoading: false })
        }
    }
}));