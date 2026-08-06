import axiosClient from "@/services/axios";
import { CheckFollowingResponse, ToggleFollowResponse, PaginatedResponse, Follow } from "../types/follow";


function extractErrorMessage(err: any): string {
    const data = err.response?.data;
    if (!data) return 'Có lỗi xảy ra, vui lòng thử lại.';
    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
    return 'Có lỗi xảy ra, vui lòng thử lại.';
}

export const followService = {
    toogleFollow: async (companyId: number): Promise<ToggleFollowResponse> => {
        try {
            const res = await axiosClient.post(`/accounts/follow/${companyId}`)
            return res.data
        } catch (err: any) {
            throw new Error(extractErrorMessage(err));
        }
    },
    checkFollowing: async (companyId: number): Promise<CheckFollowingResponse> => {
        try {
            const res = await axiosClient.get(`/accounts/follow/${companyId}/status`);
            return res.data;
        } catch (err) {
            throw new Error(extractErrorMessage(err));
        }
    },
    getMyFollows: async (page = 1): Promise<PaginatedResponse<Follow>> => {
        try {
            const res = await axiosClient.get('/accounts/follow', { params: { page } });
            return res.data;
        } catch (err) {
            throw new Error(extractErrorMessage(err));
        }
    },
}