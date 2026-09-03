import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import {
    getAdminAccountList, getAccountLockHistory,
    lockSeeker, unlockSeeker, lockCompany, unlockCompany,
} from '../services/accountService';
import { AdminAccountListParams, AdminAccountItem, Role } from '../types/account';

export function useAdminAccountList(params: AdminAccountListParams) {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['admin-account-list', user?.id, params],
        queryFn: () => getAdminAccountList(params),
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}

export function useAccountLockHistory(accountId: number | null) {
    return useQuery({
        queryKey: ['account-lock-history', accountId],
        queryFn: () => getAccountLockHistory(accountId as number),
        enabled: !!accountId,
    });
}

export function useLockAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ account, reason }: { account: AdminAccountItem; reason: string }) =>
            account.role === Role.COMPANY
                ? lockCompany(account.id, reason)
                : lockSeeker(account.id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-account-list'] });
            queryClient.invalidateQueries({ queryKey: ['account-lock-history'] });
        },
    });
}

export function useUnlockAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (account: AdminAccountItem) =>
            account.role === Role.COMPANY
                ? unlockCompany(account.id)
                : unlockSeeker(account.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-account-list'] });
            queryClient.invalidateQueries({ queryKey: ['account-lock-history'] });
        },
    });
}