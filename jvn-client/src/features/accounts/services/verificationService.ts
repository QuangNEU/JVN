import axiosClient from '@/services/axios';
import { VerificationStatus, BusinessCertListResponse } from '../types/verification';

export async function getMyVerificationStatus(): Promise<VerificationStatus> {
    const res = await axiosClient.get('/accounts/me/verification-status');
    return res.data;
}

export async function sendEmailVerification(): Promise<{ message: string }> {
    const res = await axiosClient.post('/accounts/email/send-verification');
    return res.data;
}

export async function confirmEmailVerification(token: string): Promise<{ message: string }> {
    const res = await axiosClient.post('/accounts/email/confirm', { token });
    return res.data;
}

export async function submitBusinessCert(file: File): Promise<{ message: string; business_cert_status: string }> {
    const formData = new FormData();
    formData.append('document', file);
    const res = await axiosClient.post('/accounts/business-cert/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

export async function getBusinessCertList(status?: string): Promise<BusinessCertListResponse> {
    const res = await axiosClient.get('/accounts/business-cert', { params: status ? { status } : {} });
    return res.data;
}

export async function approveBusinessCert(companyId: number) {
    const res = await axiosClient.post(`/accounts/business-cert/${companyId}/approve`);
    return res.data;
}

export async function rejectBusinessCert(companyId: number, reason: string) {
    const res = await axiosClient.post(`/accounts/business-cert/${companyId}/reject`, { reason });
    return res.data;
}