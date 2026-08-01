import axiosClient from '@/services/axios';
import { Category } from '../types/jobs';

export async function getCategories(status?: string): Promise<Category[]> {
    const response = await axiosClient.get('/jobs/categories', { params: { status } });
    return response.data;
}