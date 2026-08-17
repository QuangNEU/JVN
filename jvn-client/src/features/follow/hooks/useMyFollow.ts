import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';

export function useMyFollows(page = 1) {
    return useQuery({
        queryKey: ['my-follows', page],
        queryFn: () => followService.getMyFollows(page),
        placeholderData: (previousData) => previousData,
        staleTime: 10 * 60 * 1000
    });
}