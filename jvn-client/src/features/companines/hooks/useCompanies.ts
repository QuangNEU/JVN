import { useQuery } from '@tanstack/react-query';
import { companyService } from '../services/companyService';
import { useAuthStore } from '@/store/useAuthStore';

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

export function useCompanyDashboardSummary() {
    const user = useAuthStore((state) => state.user);
    return useQuery({
        queryKey: ['company', 'dashboard-summary', user?.id],
        queryFn: companyService.getCompanyDashboardSummary,
        enabled: !!user,
    });
}

export function useApplicationStatusBreakdown() {
    const user = useAuthStore((state) => state.user);
    return useQuery({
        queryKey: ['company', 'application-breakdown', user?.id],
        queryFn: companyService.getApplicationStatusBreakdown,
        enabled: !!user,
    });
}

export function useJobsPendingReview() {
    const user = useAuthStore((state) => state.user);
    return useQuery({
        queryKey: ['company', 'jobs-pending-review', user?.id],
        queryFn: companyService.getJobsPendingReview,
        enabled: !!user,
    });
}