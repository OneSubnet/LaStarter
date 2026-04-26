import { useTranslation } from 'react-i18next';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import type { ConversationInboxItem } from '@/types/ailes-invisibles';

type FilterKey = 'active' | 'unassigned' | 'assigned' | 'drafts' | 'archived' | 'spam';

type NavItem = {
    key: FilterKey;
    label: string;
    icon: React.ElementType;
    count: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversations: ConversationInboxItem[];
    onSelect: (id: number) => void;
    navItems: NavItem[];
    onNavChange: (key: FilterKey) => void;
};

export function InboxCommandPalette({ open, onOpenChange, conversations, onSelect, navItems, onNavChange }: Props) {
    const { t } = useTranslation();

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('ai.conversations.search_conversations')}
            description={t('ai.conversations.cmd_subtitle')}
        >
            <CommandInput placeholder={t('ai.conversations.search_conversations')} />
            <CommandList>
                <CommandEmpty>{t('ai.conversations.no_conversations')}</CommandEmpty>

                <CommandGroup heading={t('ai.conversations.group_conversations')}>
                    {conversations.slice(0, 10).map((conv) => (
                        <CommandItem
                            key={conv.id}
                            onSelect={() => { onSelect(conv.id); onOpenChange(false); }}
                        >
                            <span className="flex-1 truncate">{conv.title ?? t('ai.conversations.conversation_fallback')}</span>
                            <span className="text-xs text-muted-foreground">
                                {conv.last_message_at
                                    ? new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                    : ''}
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading={t('ai.conversations.group_navigation')}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <CommandItem
                                key={item.key}
                                onSelect={() => onNavChange(item.key)}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{item.label}</span>
                                {item.count > 0 && (
                                    <span className="text-xs text-muted-foreground">{item.count}</span>
                                )}
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
