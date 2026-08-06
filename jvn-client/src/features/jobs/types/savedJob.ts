import { JobPost, PaginatedResponse } from './jobs';

export interface SavedJob {
    id: number;
    job_post: JobPost;
    created_at: string;
}

export interface ToggleSaveJobResponse {
    is_saved: boolean;
    message: string;
}

export interface CheckSavedJobResponse {
    is_saved: boolean;
}

export type { PaginatedResponse };