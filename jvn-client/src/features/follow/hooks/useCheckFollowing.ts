import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';

export function useCheckFollowing(companyId: number) {
    return useQuery({
        queryKey: ['check-following', companyId],
        queryFn: () => followService.checkFollowing(companyId),
        enabled: !!companyId,
        retry: false,
        staleTime: 5 * 60 * 10000,
    });
}