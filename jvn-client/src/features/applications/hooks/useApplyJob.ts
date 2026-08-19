import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import { ApplyJobPayload } from '../types/application';
import { useAuthStore } from '@/store/useAuthStore';

export function useApplyJob(jobPostId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ApplyJobPayload) => applicationService.applyJob(jobPostId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
        },
    });
}

export function useCheckApplied(jobPostId: number) {
    const user = useAuthStore((state) => state.user);
    const { isAuthenticated } = useAuthStore()
    return useQuery({
        queryKey: ['applications', 'check-applied', jobPostId, user?.id],
        queryFn: () => applicationService.checkApplied(jobPostId),
        enabled: !!jobPostId && isAuthenticated,
        select: (data) => data.is_applied,
    });
}

export function useAppliedJobIds(jobPostIds: number[]) {
    const user = useAuthStore((state) => state.user);
    return useQuery({
        queryKey: ['applications', 'check-applied-bulk', jobPostIds, user?.id],
        queryFn: () => applicationService.checkAppliedBulk(jobPostIds),
        enabled: jobPostIds.length > 0 && !!user,
        select: (data) => new Set(data.applied_job_ids),
    });
}