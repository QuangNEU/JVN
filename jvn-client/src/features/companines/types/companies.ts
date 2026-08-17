export interface Company {
    id: number;
    name: string;
    logo: string | null;
    province: string;
    ward: string;
    industry: string | null;
    headcount: string | null;
}

export interface FeaturedCompany extends Company {
    followers_count: number;
    active_jobs_count: number;
    is_promoted: boolean;
}

export interface CompanyDetail extends FeaturedCompany {
    description: string | null;
    exact_address: string | null;
    website: string | null;
    founded_date: string | null;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}