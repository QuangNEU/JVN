import { JobPendingReview, FeaturedCompany, CompanyDetail, PaginatedResponse, CompanyDashboardSummary, ApplicationStatusBreakdownItem, JobConversionFunnel, SystemOverview } from '../types/companies';
import axiosClient from '@/services/axios';

export const companyService = {
    getFeatured: async (): Promise<FeaturedCompany[]> => {
        const res = await axiosClient.get('/companies/featured');
        return res.data;
    },

    search: async (params: { keyword?: string; industry?: string; province?: string; page?: number }): Promise<PaginatedResponse<FeaturedCompany>> => {
        const res = await axiosClient.get('/companies/search', { params });
        return res.data;
    },

    getDetail: async (companyId: number): Promise<CompanyDetail> => {
        const res = await axiosClient.get(`/companies/${companyId}`);
        return res.data;
    },

    getCompanyDashboardSummary: async (): Promise<CompanyDashboardSummary> => {
        const res = await axiosClient.get('/companies/dashboard-summary');
        return res.data;
    },

    getApplicationStatusBreakdown: async (): Promise<ApplicationStatusBreakdownItem[]> => {
        const res = await axiosClient.get('/companies/application-status-breakdown');
        return res.data;
    },
    getSystemOverview: async (): Promise<SystemOverview> => {
        const res = await axiosClient.get('/companies/system-overview');
        return res.data;
    },
    getJobConversionFunnel: async (): Promise<JobConversionFunnel> => {
        const res = await axiosClient.get('/companies/job-conversion-funnel');
        return res.data;
    },

    getJobsPendingReview: async (): Promise<JobPendingReview[]> => {
        const res = await axiosClient.get('/companies/jobs-pending-review');
        return res.data;
    },
};