import axiosClient from '@/services/axios';
import { Tag } from '../types/tag';

export async function getTags(): Promise<Tag[]> {
    const response = await axiosClient.get('/resumes/tags');
    return response.data;
}