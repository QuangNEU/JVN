import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { getAdminReports, resolveReport, dismissReport } from '../services/reportService';
import { ReportListParams, DismissReportPayload } from '../types/report';

export function useAdminReports(params: ReportListParams) {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['admin-reports', user?.id, params],
        queryFn: () => getAdminReports(params),
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}

export function useResolveReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, admin_note }: { reportId: number; admin_note?: string }) =>
            resolveReport(reportId, admin_note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
        },
    });
}

export function useDismissReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: DismissReportPayload) => dismissReport(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
        },
    });
}