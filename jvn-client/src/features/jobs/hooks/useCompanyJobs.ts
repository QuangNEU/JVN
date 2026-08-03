import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyJobPosts, deleteJobPost, getJobPostDetail, updateJobPost } from '../services/jobs';
import { JobPostListParams, JobPostFormData } from '../types/jobs';

export function useCompanyJobs(params: JobPostListParams) {
    return useQuery({
        queryKey: ['company-jobs', params],
        queryFn: () => getMyJobPosts(params),
    });
}

export function useDeleteJobPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteJobPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
        },
    });
}

export function useJobPostDetail(id: number) {
    return useQuery({
        queryKey: ['job-post-detail', id],
        queryFn: () => getJobPostDetail(id),
        enabled: !!id,
    });
}

export function useUpdateJobPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<JobPostFormData> }) =>
            updateJobPost(id, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job-post-detail', variables.id] });
        },
    });
}