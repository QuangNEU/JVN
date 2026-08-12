export interface VerificationStatus {
    email_verified: boolean;
    business_cert_status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    business_cert_rejected_reason: string | null;
    verification_level: number;
}

export interface CompanyCertReview {
    id: number;
    company_name: string;
    tax_code: string | null;
    document_url: string | null;
    business_cert_status: string;
    business_cert_rejected_reason: string | null;
    business_cert_reviewed_at: string | null;
}

export interface BusinessCertListResponse {
    results: CompanyCertReview[];
    count: number;
}