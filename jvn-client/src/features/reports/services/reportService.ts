import axiosClient from "@/services/axios";
import { CreateReportPayload, ReportListParams, DismissReportPayload, Report } from "../types/report";
import { PaginatedResponse } from "@/features/jobs/types/jobs";

export async function createReport(payload: CreateReportPayload): Promise<Report> {
    const response = await axiosClient.post('/reports', payload);
    return response.data
}

export async function getAdminReports(
    params: ReportListParams = {},
): Promise<PaginatedResponse<Report>> {
    const response = await axiosClient.get('/reports/admin', { params });
    return response.data
}

export async function resolveReport(reportId: number, admin_note?: string): Promise<Report> {
    const response = await axiosClient.post(`/reports/${reportId}/resolve`, { admin_note });
    return response.data
}

export async function dismissReport({ reportId, admin_note }: DismissReportPayload): Promise<Report> {
    const response = await axiosClient.post(`/reports/${reportId}/dismiss`, { admin_note });
    return response.data
}