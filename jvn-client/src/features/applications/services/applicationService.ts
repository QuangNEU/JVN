import axiosClient from '@/services/axios';
import { Application, ApplyJobPayload, GetMyApplicationsParams, PaginatedResponse, CompanyApplication, UpdateStatusPayload, BulkCheckAppliedResponse } from '../types/application';

export const applicationService = {
    applyJob: async (jobPostId: number, payload: ApplyJobPayload): Promise<Application> => {
        const res = await axiosClient.post(`/applications/apply/${jobPostId}`, payload);
        return res.data;
    },

    getMyApplications: async (params: GetMyApplicationsParams = {}): Promise<PaginatedResponse<Application>> => {
        const res = await axiosClient.get('/applications/me', { params });
        return res.data;
    },

    getJobApplicants: async (jobId: number, status?: string): Promise<PaginatedResponse<CompanyApplication>> => {
        const res = await axiosClient.get(`/applications/job/${jobId}`, { params: status ? { status } : {} });
        return res.data;
    },

    updateApplicationStatus: async (applicationId: number, payload: UpdateStatusPayload): Promise<CompanyApplication> => {
        const res = await axiosClient.patch(`/applications/update-status/${applicationId}`, payload);
        return res.data;
    },

    checkApplied: async (jobPostId: number): Promise<{ is_applied: boolean }> => {
        const res = await axiosClient.get(`/applications/check-applied/${jobPostId}`);
        return res.data;
    },
    checkAppliedBulk: async (jobPostIds: number[]): Promise<BulkCheckAppliedResponse> => {
        const res = await axiosClient.get('/applications/check-applied/bulk', {
            params: { job_post_ids: jobPostIds },
            paramsSerializer: { indexes: null },
        });
        return res.data;
    }
};