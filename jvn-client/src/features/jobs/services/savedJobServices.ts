import axiosClient from '@/services/axios';
import { SavedJob, ToggleSaveJobResponse, CheckSavedJobResponse, PaginatedResponse } from '../types/savedJob';


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