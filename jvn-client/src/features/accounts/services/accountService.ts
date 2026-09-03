import { ForgotPasswordPayLoad, GoogleLoginPayLoad, LoginPayLoad, LoginResponse, RegisterPayLoad, ResetPasswordPayLoad, AdminAccountItem, AdminAccountListParams, AccountLockHistoryItem } from "@/features/accounts/types/account";
import { PaginatedResponse } from "@/features/jobs/types/jobs";
import axiosClient from "@/services/axios";

export async function login(payload: LoginPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/login",
        payload
    );
    return response.data
}

export async function googleLogin(payload: GoogleLoginPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/google",
        payload
    )
    return response.data
}

export async function logout(): Promise<void> {
    await axiosClient.post("/auth/logout")
}

export async function register(payload: RegisterPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/register",
        payload
    )
    return response.data
}

export async function forgotpassword(payload: ForgotPasswordPayLoad) {
    const response = await axiosClient.post(
        "/auth/forgot-password",
        payload
    )
    return response
}

export async function resetPassword(payload: ResetPasswordPayLoad) {
    const response = await axiosClient.post(
        "/auth/reset-password",
        payload
    )
    return response
}

export async function getAdminAccountList(
    params: AdminAccountListParams = {},
): Promise<PaginatedResponse<AdminAccountItem>> {
    const response = await axiosClient.get('/accounts/admin-list', { params });
    return response.data;
}

export async function getAccountLockHistory(accountId: number): Promise<AccountLockHistoryItem[]> {
    const response = await axiosClient.get(`/accounts/${accountId}/lock-history`);
    return response.data;
}

export async function lockSeeker(accountId: number, reason: string): Promise<AdminAccountItem> {
    const response = await axiosClient.post(`/accounts/${accountId}/lock-seeker`, { reason });
    return response.data;
}

export async function unlockSeeker(accountId: number): Promise<AdminAccountItem> {
    const response = await axiosClient.post(`/accounts/${accountId}/unlock-seeker`);
    return response.data;
}

export async function lockCompany(accountId: number, reason: string): Promise<AdminAccountItem> {
    const response = await axiosClient.post(`/companies/${accountId}/lock`, { reason });
    return response.data;
}

export async function unlockCompany(accountId: number): Promise<AdminAccountItem> {
    const response = await axiosClient.post(`/companies/${accountId}/unlock`);
    return response.data;
}