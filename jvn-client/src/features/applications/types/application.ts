import { JobPost } from '@/features/jobs/types/jobs';
import { CV } from '../../resumes/types/cv';

export type ApplicationStatus =
    | 'SENT'
    | 'RECEIVED'
    | 'WATCHED'
    | 'SUITABLE'
    | 'REJECTED'
    | 'INTERVIEWING'
    | 'HIRED';

export interface Application {
    id: number;
    cv: CV;
    job_post: JobPost;
    cover_letter: string;
    status: ApplicationStatus;
    date_applied: string;
}

export interface ApplyJobPayload {
    cv_id: number;
    cover_letter?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface GetMyApplicationsParams {
    status?: ApplicationStatus;
    page?: number;
}