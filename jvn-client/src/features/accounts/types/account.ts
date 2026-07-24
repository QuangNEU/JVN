export const Role = {
    SEEKER: 'SEEKER',
    COMPANY: 'COMPANY',
    ADMIN: 'ADMIN',
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface JobSeekerProfile {
    github_urls: string | null;
}

export interface CompanyProfile {
    description: string | null;
    headcount: number | null;
    province: string;
    ward: string;
    exact_address: string | null;
    logo: string | null;
}

export interface Account {
    id: number;
    email: string;
    name: string
    role: Role;
    tel: string;
    profile: JobSeekerProfile | CompanyProfile | null;
}

export interface LoginPayLoad {
    email: string;
    password: string;
}

export interface GoogleLoginPayLoad {
    google_token: string;
    role?: string;
}

export interface LoginResponse {
    user: Account;
}

export interface RegisterPayLoad {
    email: string;
    password: string;
    role: Extract<Role, 'SEEKER' | 'COMPANY'>
    name: string;
    province?: string;
    ward?: string;
    tel?: string;
}

export interface ForgotPasswordPayLoad {
    email: string
}

export interface ResetPasswordPayLoad {
    uid: string;
    token: string;
    new_password: string;
    confirm_new_password: string;
}