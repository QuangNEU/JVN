import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import { ApplyJobPayload } from '../types/application';

export function useApplyJob(jobPostId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ApplyJobPayload) => applicationService.applyJob(jobPostId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
        },
    });
}