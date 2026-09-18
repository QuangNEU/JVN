import { create } from 'zustand';
import { ChatState } from '@/features/chats/types/chat';

export const useChatStore = create<ChatState>((set, get) => ({
    socket: null,
    isConnected: false,
    messages: [],
    activeConversationId: null,

    connect: (ticket) => {
        if (get().socket) return;

        const socket = new WebSocket(`wss://api.jvn.com/ws/chats/?ticket=${ticket}`);

        socket.onopen = () => set({ isConnected: true });

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event_name === 'new_message') {
                set((state) => ({ messages: [...state.messages, data] }));
            } else if (data.event_name === 'inbox_update') {
                // TODO
            }
        };

        socket.onclose = () => set({ isConnected: false, socket: null });

        set({ socket });
    },

    disconnect: () => {
        get().socket?.close();
        set({ socket: null, isConnected: false });
    },

    joinConversation: (conversationId) => {
        set({ messages: [], activeConversationId: conversationId });
        get().socket?.send(JSON.stringify({ action: 'join_conversation', conversation_id: conversationId }));
    },

    leaveConversation: () => {
        get().socket?.send(JSON.stringify({ action: 'leave_conversation' }));
        set({ activeConversationId: null });
    },
}));