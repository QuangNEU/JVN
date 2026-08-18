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
    locations?: string[];
    salary_min?: number;
    salary_max?: number;
    level?: JobLevelType;
    category_ids?: number[];
    type?: JobTypeType;
}

export interface Category {
    id: number
    title: string
    children: Category[]
}

export interface CategoryRequestItem {
    id: number
    title: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejected_reason: string | null
    created_by: number | null
    parent: number | null
    created_at: string
    updated_at: string
}

export interface CategoryRequestPayload {
    title: string;
    parent_id?: number;
}

export interface ResubmitCategoryPayload {
    categoryId: number;
    data: CategoryRequestPayload;
}

export interface DenyCategoryPayload {
    categoryId: number;
    reason: string;
}

export interface MyCategoryRequestsParams {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Tag {
    id: number
    tag_name: string
}

export interface JobPost {
    id: number;
    title: string;
    descriptions: string;
    requirement: string;
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
    company_province: string | null;
    company_ward: string | null;
    company_exact_address: string | null;
    company_logo: string | null;
    company_headcount: string | null;
    company_industry: string | null;
    company_id: number | null
    // company_website: string | null;
    category: Category[];
    tags: Tag[];
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

export interface ExpiringJob {
    id: number;
    title: string;
    expiration_date: string;
    headcount: number;
}