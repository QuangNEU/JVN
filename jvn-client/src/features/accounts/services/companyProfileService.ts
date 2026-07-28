import axiosClient from "@/services/axios";
import { Account, CompanyProfile, JobSeekerProfile } from "../types/account";

export async function getMyProfile(): Promise<Account> {
    const response = await axiosClient.get('/accounts/me')
    return response.data
}

export async function updateMyProfile(payload: Partial<CompanyProfile | JobSeekerProfile | FormData>): Promise<Account> {
    const response = await axiosClient.patch('/accounts/me', payload)
    return response.data
}