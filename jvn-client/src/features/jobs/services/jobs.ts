import axiosClient from "@/services/axios";
import {
    CreateJobPostResponse,
    JobPost,
    JobPostFormData,
    PaginatedResponse,
    JobPostListParams,
    ExpiringJob,
    RejectJobPostPayload,
    JobPostReviewParams
} from "../types/jobs";


export async function createJobPost(payload: JobPostFormData): Promise<JobPost> {
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

export async function getExpiringJobs(): Promise<ExpiringJob[]> {
    const res = await axiosClient.get('/jobs/expiring-soon');
    return res.data;
}

export async function approveJobPost(id: number): Promise<JobPost> {
    const response = await axiosClient.post(`/jobs/job-post/${id}/approve`);
    return response.data
}

export async function rejectJobPost({ jobPostId, reason }: RejectJobPostPayload): Promise<JobPost> {
    const response = await axiosClient.post(`/jobs/job-post/${jobPostId}/reject`, { reason });
    return response.data
}

export async function getAdminJobPostReview(
    params: JobPostReviewParams = {},
): Promise<PaginatedResponse<JobPost>> {
    const response = await axiosClient.get('/jobs/job-post/admin-review', { params });
    return response.data
}