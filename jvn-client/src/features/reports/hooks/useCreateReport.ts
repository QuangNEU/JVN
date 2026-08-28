import { useMutation } from '@tanstack/react-query';
import { createReport } from '../services/reportService';
import { CreateReportPayload } from '../types/report';

export function useCreateReport() {
    return useMutation({
        mutationFn: (payload: CreateReportPayload) => createReport(payload),
    });
}