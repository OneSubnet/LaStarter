import { useEffect } from 'react';
import type { MessageDetail } from '@/types/ailes-invisibles';

type BroadcastMessage = {
    id: number;
    conversation_id: number;
    sender_type: string;
    sender_id: number;
    sender_name: string;
    content: string;
    type: string;
    is_mine: boolean;
    encrypted_content: string;
    iv: string;
    file_name: string | null;
    file_size: number | null;
    encrypted_keys: { participant_type: string; participant_id: number; encrypted_key: string }[];
    read_receipts: { reader_type: string; reader_id: number; read_at: string }[];
    created_at: string;
};

type Props = {
    conversationId: number | null;
    onMessage: (msg: MessageDetail) => void;
};

export function useConversationChannel({ conversationId, onMessage }: Props) {
    useEffect(() => {
        if (!conversationId || !window.Echo) return;

        const channel = window.Echo.join(`conversation.${conversationId}`);

        channel.listen('.new-message', (event: BroadcastMessage) => {
            onMessage({
                id: event.id,
                sender_type: event.sender_type,
                sender_id: event.sender_id,
                sender_name: event.sender_name,
                encrypted_content: event.encrypted_content ?? '',
                content: event.content ?? undefined,
                iv: event.iv ?? '',
                type: event.type,
                file_name: event.file_name ?? null,
                file_size: event.file_size ?? null,
                is_mine: event.is_mine,
                encrypted_keys: event.encrypted_keys ?? [],
                read_receipts: event.read_receipts ?? [],
                created_at: event.created_at,
            });
        });

        return () => {
            window.Echo.leave(`conversation.${conversationId}`);
        };
    }, [conversationId, onMessage]);
}
