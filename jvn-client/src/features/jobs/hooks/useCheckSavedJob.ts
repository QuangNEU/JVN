import { useQuery } from '@tanstack/react-query';
import { savedJobService } from '../services/savedJobServices';

export function useCheckSavedJob(jobPostId: number) {
    return useQuery({
        queryKey: ['check-saved-job', jobPostId],
        queryFn: () => savedJobService.checkSaved(jobPostId),
        enabled: !!jobPostId,
        retry: false,
        staleTime: 5 * 60 * 10000
    });
}