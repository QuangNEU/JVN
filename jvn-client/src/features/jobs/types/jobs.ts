export const JOB_LEVEL = {
    INTERN: 'INTERN',
    FRESHER: 'FRESHER',
    JUNIOR: 'JUNIOR',
    SENIOR: 'SENIOR'
} as const

export const JOB_TYPE = {
    FULLTIME: 'FULLTIME',
    PARTTIME: 'PARTTIME',
    HYBRID: 'HYBRID',
    REMOTE: 'REMOTE'
} as const

export const JOB_STATUS = {
    PUBLISHED: 'PUBLISHED',
    CLOSED: 'CLOSED'
} as const

export type JobLevelType = typeof JOB_LEVEL[keyof typeof JOB_LEVEL];
export type JobTypeType = typeof JOB_TYPE[keyof typeof JOB_TYPE];
export type JobStatusType = typeof JOB_STATUS[keyof typeof JOB_STATUS];

export interface PublicJobFilterPayload {
    keyword?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    level?: JobLevelType;
    category_id?: number;
    type?: JobTypeType;
}

export interface Category {
    id: number
    title: string
    children: Category[]
}

export interface Tag {
    id: number
    tag_name: string
}

export interface JobPost {
    id: number,
    title: string,
    descriptions: string,
    requirement: string,
    benefit: string | null;
    type: JobTypeType;
    status: JobStatusType;
    level: JobLevelType;
    experience_requirement: string;
    headcount: number;
    salary_min: string | null;
    salary_max: string | null;
    currency: string;
    is_negotiable: boolean;
    date_posted: string | null;
    expiration_date: string | null;
    company_name: string;
    category: Category[];
    tags: Tag[];
    company_province: string | null;
}

export interface JobPostFormData {
    title: string;
    descriptions: string;
    requirement: string;
    benefit: string;
    type: JobTypeType;
    level: JobLevelType;
    experience_requirement: string;
    headcount: number
    salary_min?: number
    salary_max?: number
    currency: string
    is_negotiable: boolean
    expiration_date?: string;
    tag_ids: number[]
    category_ids: number[]
}

export interface CreateJobPostResponse {
    message: string;
    id: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null,
    results: T[]
}


export interface JobPostListParams {
    page?: number;
    page_size?: number;
    status?: string;
}