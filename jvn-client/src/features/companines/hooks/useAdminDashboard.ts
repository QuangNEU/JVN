import { useQuery } from "@tanstack/react-query";
import { companyService } from "../services/companyService";

export function useSystemOverview() {
    return useQuery({
        queryKey: ['system-overview'],
        queryFn: companyService.getSystemOverview,
        staleTime: 5 * 60 * 1000, // số liệu tổng hệ thống không cần real-time gắt, 5 phút đủ mới
    });
}

export function useJobConversionFunnel() {
    return useQuery({
        queryKey: ['job-conversion-funnel'],
        queryFn: companyService.getJobConversionFunnel,
        staleTime: 5 * 60 * 1000,
    });
}