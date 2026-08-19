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

export interface CompanyApplication {
    id: number;
    applicant_name: string;
    cv: CV;
    cover_letter: string;
    status: ApplicationStatus;
    date_applied: string;
    updated_at: string;
    interview_date: string | null;
    rejected_reason: string;
}

export interface UpdateStatusPayload {
    status: ApplicationStatus;
    interview_date?: string;
    rejected_reason?: string;
}

export interface BulkCheckAppliedResponse {
    applied_job_ids: number[];
}