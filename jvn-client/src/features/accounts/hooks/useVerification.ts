import { confirmEmailVerification } from "../services/verificationService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from "@/store/useAuthStore";
import {
    getMyVerificationStatus, sendEmailVerification, submitBusinessCert,
    getBusinessCertList, approveBusinessCert, rejectBusinessCert,
} from '../services/verificationService';

export function useConfirmEmailVerification() {
    return useMutation({ mutationFn: confirmEmailVerification });
}

export function useMyVerificationStatus() {
    const user = useAuthStore((s) => s.user);
    return useQuery({
        queryKey: ['my-verification-status', user?.id],
        queryFn: getMyVerificationStatus,
        enabled: !!user,
    });
}

export function useSendEmailVerification() {
    return useMutation({ mutationFn: sendEmailVerification });
}

export function useSubmitBusinessCert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitBusinessCert,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-verification-status'] }),
    });
}

export function useBusinessCertList(status?: string) {
    return useQuery({
        queryKey: ['business-cert-list', status],
        queryFn: () => getBusinessCertList(status),
    });
}

export function useApproveBusinessCert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveBusinessCert,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-cert-list'] }),
    });
}

export function useRejectBusinessCert() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, reason }: { companyId: number; reason: string }) => rejectBusinessCert(companyId, reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-cert-list'] }),
    });
}