import { useQuery } from '@tanstack/react-query';
import { getPublicJobs, getPublicJobDetail, PublicJobListParams } from '../services/publicJobs';

export function usePublicJobs(params: PublicJobListParams, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['public-jobs', params],
        queryFn: () => getPublicJobs(params),
        enabled: options?.enabled ?? true,
        staleTime: 60 * 1000
    });
}

export function usePublicJobDetail(id: number) {
    return useQuery({
        queryKey: ['public-job-detail', id],
        queryFn: () => getPublicJobDetail(id),
        enabled: !!id,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    });
}