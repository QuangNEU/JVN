import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyJobPosts, deleteJobPost } from '../services/jobs';
import { JobPostListParams } from '../types/jobs';

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