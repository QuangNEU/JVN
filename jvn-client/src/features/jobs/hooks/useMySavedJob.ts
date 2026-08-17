import { useQuery } from '@tanstack/react-query';
import { savedJobService } from '../services/savedJobServices';
export function useMySavedJobs(page = 1) {
    return useQuery({
        queryKey: ['my-saved-jobs', page],
        queryFn: () => savedJobService.getMySavedJobs(page),
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000
    });
}