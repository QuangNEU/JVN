import { PaginatedResponse } from "@/features/companines/types/companies";
import { AppNotification } from "../types/notifications";
import axiosClient from "@/services/axios";


export const notificationServices = {
    getList: async (): Promise<PaginatedResponse<AppNotification>> => {
        const res = await axiosClient.get(`/notifications`)
        return res.data
    },

    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        const res = await axiosClient.get(`/notifications/unread-count`)
        return res.data
    },

    markNotificationRead: async (id: number): Promise<AppNotification> => {
        const res = await axiosClient.patch(`/notifications/${id}/read`)
        return res.data
    },

    markAllRead: async () => {
        const res = await axiosClient.patch(`/notifications/mark-all-read`)
        return res.data
    }
}