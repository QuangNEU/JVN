import { Company } from "@/features/accounts/types/company";

export interface Follow {
    id: number;
    company: Company;
    created_at: string;
}

export interface ToggleFollowResponse {
    is_following: boolean;
    message: string;
}

export interface CheckFollowingResponse {
    is_following: boolean;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}