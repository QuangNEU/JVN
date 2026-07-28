import axiosClient from "@/services/axios";
import {
    CreateJobPostResponse,
    JobPost,
    JobPostFormData,
    PaginatedResponse,
} from "../types/jobs";

export interface JobPostListParams {
    page?: number;
    page_size?: number;
}

export async function createJobPost(payload: JobPostFormData): Promise<CreateJobPostResponse> {
    const response = await axiosClient.post('/jobs/company', payload);
    return response.data
}

export async function updateJobPost(id: number, payload: Partial<JobPostFormData>): Promise<JobPost> {
    const response = await axiosClient.patch(`/jobs/company/${id}`, payload)
    return response.data
}

export async function getMyJobPosts(
    params: JobPostListParams = {},
): Promise<PaginatedResponse<JobPost>> {
    const response = await axiosClient.get('/jobs/company', { params });
    return response.data
}

export async function deleteJobPost(id: number) {
    const response = await axiosClient.delete(`/jobs/company/${id}`)
    return response.data
}

export async function getJobPostDetail(id: number): Promise<JobPost> {
    const response = await axiosClient.get(`/jobs/company/${id}`)
    return response.data
}
