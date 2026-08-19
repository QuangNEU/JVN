import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { useAuthStore } from '@/store/useAuthStore';
export function useCheckFollowing(companyId: number) {
    const { isAuthenticated, user } = useAuthStore()
    return useQuery({
        queryKey: ['check-following', companyId, user?.id],
        queryFn: () => followService.checkFollowing(companyId),
        enabled: !!companyId && isAuthenticated,
        retry: false,
        staleTime: 5 * 60 * 10000,
    });
}