import axiosClient from '@/services/axios';
import { Category, CategoryRequestItem, CategoryRequestPayload, DenyCategoryPayload, ResubmitCategoryPayload, PaginatedResponse, MyCategoryRequestsParams } from '../types/jobs';

export async function getApprovedCategories() {
    const response = await axiosClient.get('/jobs/categories');
    return response.data;
}

export async function getAdminCategories(params?: MyCategoryRequestsParams): Promise<PaginatedResponse<CategoryRequestItem>> {
    const res = await axiosClient.get('/jobs/categories/admin', { params });
    return res.data;
}

export async function approveCategory(categoryId: number) {
    const res = await axiosClient.post(`/jobs/categories/${categoryId}/approve`);
    return res.data;
}

export async function denyCategory(payload: DenyCategoryPayload) {
    const res = await axiosClient.post(`/jobs/categories/${payload.categoryId}/deny`, { rejected_reason: payload.reason });
    return res.data;
}

export async function createCategory(data: CategoryRequestPayload) {
    const res = await axiosClient.post(`/jobs/categories`, data)
    return res.data
}

export async function resubmitCategory(data: ResubmitCategoryPayload) {
    const res = await axiosClient.patch(`/jobs/categories/${data.categoryId}/resubmit`, data.data)
    return res.data
}

export async function getMyCategoryRequest(params?: MyCategoryRequestsParams): Promise<PaginatedResponse<CategoryRequestItem>> {
    const res = await axiosClient.get('/jobs/categories/my-request', { params });
    return res.data;
}