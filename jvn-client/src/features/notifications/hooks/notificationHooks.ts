// hooks/useNotifications.ts
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { notificationServices } from '../services/notificationServices';

export function useUnreadNotificationCount() {
    const user = useAuthStore((s) => s.user);
    return useQuery({
        queryKey: ['notifications', 'unread-count', user?.id],
        queryFn: notificationServices.getUnreadCount,
        enabled: !!user,
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
        select: (data) => data.unread_count,
    });
}

export function useNotificationList() {
    const user = useAuthStore((s) => s.user);
    return useQuery({
        queryKey: ['notifications', 'list', user?.id],
        queryFn: notificationServices.getList,
        enabled: !!user,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    return useMutation({
        mutationFn: notificationServices.markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list', user?.id] });
        },
    });
}

export function useMarkAllRead() {
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    return useMutation({
        mutationFn: notificationServices.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list', user?.id] });
        },
    });
}