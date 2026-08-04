import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import { GetMyApplicationsParams } from '../types/application';

export function useMyApplications(params: GetMyApplicationsParams = {}) {
    return useQuery({
        queryKey: ['my-applications', params.status ?? 'ALL', params.page ?? 1],
        queryFn: () => applicationService.getMyApplications(params),
        placeholderData: (previousData) => previousData,
    });
}