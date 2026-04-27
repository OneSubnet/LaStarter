import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MessageDetail } from '@/types/ailes-invisibles';
import { MessageBubble } from './MessageBubble';

type Props = {
    messages: MessageDetail[];
    downloadUrl?: (msgId: number) => string;
};

export function MessageThread({ messages, downloadUrl }: Props) {
    const { t } = useTranslation();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-4">
                {/* Encryption banner */}
                <div className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{t('ai.conversations.e2e_notice')}</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3 w-3 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-xs">
                                {t('ai.conversations.encryption_tooltip')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <p className="text-sm">{t('ai.conversations.no_messages')}</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            downloadUrl={downloadUrl?.(msg.id)}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
