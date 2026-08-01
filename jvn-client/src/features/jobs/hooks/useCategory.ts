import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/catergoryService';

export function useApprovedCategories() {
    return useQuery({
        queryKey: ['categories', 'APPROVED'],
        queryFn: () => getCategories('APPROVED'),
        staleTime: 10 * 60 * 1000,
    });
}