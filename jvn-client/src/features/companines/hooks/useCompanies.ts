import { useQuery } from '@tanstack/react-query';
import { companyService } from '../services/companyService';

export function useFeaturedCompanies() {
    return useQuery({
        queryKey: ['featured-companies'],
        queryFn: () => companyService.getFeatured(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSearchCompanies(params: { keyword?: string; industry?: string; province?: string; page?: number }) {
    return useQuery({
        queryKey: ['search-companies', params],
        queryFn: () => companyService.search(params),
        placeholderData: (prev) => prev,
    });
}

export function useCompanyDetail(companyId: number) {
    return useQuery({
        queryKey: ['company-detail', companyId],
        queryFn: () => companyService.getDetail(companyId),
        enabled: !!companyId,
    });
}