import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import { ApplicationStatus } from '../types/application';

export function useJobApplicants(jobId: number, statusFilter?: ApplicationStatus) {
    return useQuery({
        queryKey: ['job-applicants', jobId, statusFilter ?? 'ALL'],
        queryFn: () => applicationService.getJobApplicants(jobId, statusFilter),
        enabled: !!jobId,
    });
}