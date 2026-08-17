import { Company, FeaturedCompany, CompanyDetail, PaginatedResponse } from '../types/companies';

export const companyService = {
    getFeatured: async (): Promise<FeaturedCompany[]> => {
        const res = await fetch('/api/companies/featured');
        if (!res.ok) throw new Error('Không tải được danh sách công ty nổi bật.');
        return res.json();
    },

    search: async (params: { keyword?: string; industry?: string; province?: string; page?: number }): Promise<PaginatedResponse<FeaturedCompany>> => {
        const query = new URLSearchParams();
        if (params.keyword) query.set('keyword', params.keyword);
        if (params.industry) query.set('industry', params.industry);
        if (params.province) query.set('province', params.province);
        if (params.page) query.set('page', String(params.page));

        const res = await fetch(`/api/companies/search?${query.toString()}`);
        if (!res.ok) throw new Error('Không tìm kiếm được công ty.');
        return res.json();
    },

    getDetail: async (companyId: number): Promise<CompanyDetail> => {
        const res = await fetch(`/api/companies/${companyId}`);
        if (!res.ok) throw new Error('Không tìm thấy công ty.');
        return res.json();
    },
};