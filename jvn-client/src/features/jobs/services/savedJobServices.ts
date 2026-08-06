import axiosClient from '@/services/axios';
import { SavedJob, ToggleSaveJobResponse, CheckSavedJobResponse, PaginatedResponse } from '../types/savedJob';

async function parseErrorMessage(res: Response): Promise<string> {
    const body = await res.json().catch(() => null);
    if (!body) return 'Có lỗi xảy ra, vui lòng thử lại.';
    if (typeof body.error === 'string') return body.error;
    if (typeof body.detail === 'string') return body.detail;
    return 'Có lỗi xảy ra, vui lòng thử lại.';
}

export const savedJobService = {
    toggleSaveJob: async (jobPostId: number): Promise<ToggleSaveJobResponse> => {
        const res = await axiosClient.post(`/jobs/saved/${jobPostId}`);
        return res.data
    },

    checkSaved: async (jobPostId: number): Promise<CheckSavedJobResponse> => {
        const res = await axiosClient.get(`/jobs/saved/${jobPostId}/status`);
        return res.data;
    },

    getMySavedJobs: async (page = 1): Promise<PaginatedResponse<SavedJob>> => {
        const res = await axiosClient.get(`/jobs/saved?page=${page}`);
        return res.data;
    },
};