import axiosClient from "@/services/axios";
import { JobPost, PaginatedResponse, PublicJobFilterPayload } from "../types/jobs";

export interface PublicJobListParams extends PublicJobFilterPayload {
    page?: number;
    page_size?: number;
}

export async function getPublicJobs(
    params: PublicJobListParams = {}
): Promise<PaginatedResponse<JobPost>> {
    const response = await axiosClient.get('/jobs/public', { params });
    return response.data;
}

export async function getPublicJobDetail(id: number): Promise<JobPost> {
    const response = await axiosClient.get(`/jobs/public/${id}`);
    return response.data;
}