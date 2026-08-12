import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getCategories, getPendingCategories, approveCategory, denyCategory } from '../services/catergoryService';

export function useApprovedCategories() {
    return useQuery({
        queryKey: ['categories', 'APPROVED'],
        queryFn: () => getCategories('APPROVED'),
        staleTime: 10 * 60 * 1000,
    });
}

export function usePendingCategories() {
    return useQuery({ queryKey: ['pending-categories'], queryFn: getPendingCategories });
}

export function useApproveCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveCategory,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-categories'] }),
    });
}

export function useDenyCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: denyCategory,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-categories'] }),
    });
}