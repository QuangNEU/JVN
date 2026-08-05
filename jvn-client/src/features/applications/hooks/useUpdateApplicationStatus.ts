import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import { UpdateStatusPayload } from '../types/application';

export function useUpdateApplicationStatus(jobId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ applicationId, payload }: { applicationId: number; payload: UpdateStatusPayload }) =>
            applicationService.updateApplicationStatus(applicationId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-applicants', jobId] });
        },
    });
}