import axiosClient from '@/services/axios';
import { Category } from '../types/jobs';

export async function getCategories(status?: string): Promise<Category[]> {
    const response = await axiosClient.get('/jobs/categories', { params: { status } });
    return response.data;
}

export async function getPendingCategories(): Promise<Category[]> {
    const res = await axiosClient.get('/jobs/categories/pending');
    return res.data;
}

export async function approveCategory(categoryId: number) {
    const res = await axiosClient.post(`/jobs/categories/${categoryId}/approve`);
    return res.data;
}

export async function denyCategory(categoryId: number) {
    const res = await axiosClient.post(`/jobs/categories/${categoryId}/deny`);
    return res.data;
}