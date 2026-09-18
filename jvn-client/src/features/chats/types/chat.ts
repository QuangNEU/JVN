export type ChatMessage = {
    conversation_id: number;
    message_id: number;
    sender_id: number;
    content: string;
    created_at: string;
};

export type ConversationUpdate = {
    conversation_id: number;
    last_message_preview: string;
    last_message_at: string;
};

export type WsTicketResponse = {
    ticket: string;
};

export interface ChatState {
    socket: WebSocket | null;
    isConnected: boolean;
    messages: ChatMessage[];
    activeConversationId: number | null;

    connect: (ticket: string) => void;
    disconnect: () => void;
    joinConversation: (conversationId: number) => void;
    leaveConversation: () => void;
}