export const REPORT_TARGET_TYPE = {
    JOB_POST: 'JOB_POST',
    COMPANY: 'COMPANY',
} as const

export const REPORT_STATUS = {
    PENDING: 'PENDING',
    RESOLVED: 'RESOLVED',
    DISMISSED: 'DISMISSED',
} as const

export type ReportTargetType = typeof REPORT_TARGET_TYPE[keyof typeof REPORT_TARGET_TYPE];
export type ReportStatusType = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];

export interface Report {
    id: number;
    reporter_email: string;
    target_type: ReportTargetType;
    job_post: number | null;
    job_post_title: string | null;
    company: number | null;
    company_name: string | null;
    reason: string;
    status: ReportStatusType;
    admin_note: string | null;
    created_at: string;
    reviewed_at: string | null;
    target_account_id: number | null;
    target_account_is_locked: boolean | null;
    target_company_name: string | null
}

export interface CreateReportPayload {
    target_type: ReportTargetType;
    target_id: number;
    reason: string;
}

export interface DismissReportPayload {
    reportId: number;
    admin_note: string;
}

export interface ReportListParams {
    status?: ReportStatusType;
    page?: number;
    page_size?: number;
}