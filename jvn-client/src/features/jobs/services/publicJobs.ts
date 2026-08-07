import axiosClient from "@/services/axios";
import { JobPost, PaginatedResponse, PublicJobFilterPayload } from "../types/jobs";

export interface PublicJobListParams extends PublicJobFilterPayload {
    page?: number;
    page_size?: number;
}

export async function getPublicJobs(
    params: PublicJobListParams = {}
): Promise<PaginatedResponse<JobPost>> {
    const { category_ids, ...rest } = params;
    const query = new URLSearchParams();

    Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, String(value));
        }
    });
    (category_ids ?? []).forEach((id) => query.append('category_ids', String(id)));

    const response = await axiosClient.get(`/jobs/public?${query.toString()}`);
    return response.data;
}

export async function getPublicJobDetail(id: number): Promise<JobPost> {
    const response = await axiosClient.get(`/jobs/public/${id}`);
    return response.data;
}