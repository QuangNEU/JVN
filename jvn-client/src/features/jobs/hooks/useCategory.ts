import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getApprovedCategories, getAdminCategories, approveCategory, denyCategory, createCategory, resubmitCategory, getMyCategoryRequest } from '../services/categoryService';
import { useAuthStore } from '@/store/useAuthStore';
import { MyCategoryRequestsParams } from '../types/jobs';
export const CATEGORY_KEYS = {
    approved: ['categories', 'approved'] as const,
    admin: (status?: string) =>
        status ? (['categories', 'admin', status] as const) : (['categories', 'admin'] as const),
    myRequests: (userId?: number, status?: string) =>
        status
            ? (['categories', 'my-requests', userId, status] as const)
            : (['categories', 'my-requests', userId] as const),
};

export function useGetApprovedCategories() {
    return useQuery({
        queryKey: CATEGORY_KEYS.approved,
        queryFn: () => getApprovedCategories(),
        staleTime: 10 * 60 * 1000,
    });
}

export function useAdminCategories(params?: MyCategoryRequestsParams) {
    const user = useAuthStore((state) => state.user);
    return useQuery({
        queryKey: CATEGORY_KEYS.admin(params?.status),
        queryFn: () => getAdminCategories(params),
        enabled: !!user,
        refetchInterval: 20 * 1000,
        refetchIntervalInBackground: false,
    });
}

export function useApproveCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', 'admin'] });
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.approved });
        }
    });
}

export function useDenyCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: denyCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', 'admin'] });
        }
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.myRequests(user?.id) });
        }
    });
}

export function useResubmitCategory() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    return useMutation({
        mutationFn: resubmitCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.myRequests(user?.id) });
        }
    });
}

export function useMyCategoryRequests(params?: MyCategoryRequestsParams) {
    const user = useAuthStore((state) => state.user);
    return useQuery({
        queryKey: CATEGORY_KEYS.myRequests(user?.id, params?.status),
        queryFn: () => getMyCategoryRequest(params),
        enabled: !!user,
    });
}