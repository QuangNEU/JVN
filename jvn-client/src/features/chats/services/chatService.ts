import axiosClient from '@/services/axios';
import { WsTicketResponse } from '../types/chat';

export const chatService = {
    getWsTicket: async (): Promise<WsTicketResponse> => {
        const res = await axiosClient.get('/chats/ws-ticket');
        return res.data;
    },
};