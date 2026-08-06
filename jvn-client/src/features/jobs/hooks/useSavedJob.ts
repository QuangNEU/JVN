import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savedJobService } from '../services/savedJobServices';

export function useSaveJob(jobPostId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => savedJobService.toggleSaveJob(jobPostId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['check-saved-job', jobPostId] });
            queryClient.invalidateQueries({ queryKey: ['my-saved-jobs'] });
        },
    });
}