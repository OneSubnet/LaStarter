import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ClientOption = {
    id: number;
    name: string;
    company_name: string | null;
    portal_user: { id: number; email: string } | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clients: ClientOption[];
    createUrl: string;
};

export function NewConversationDialog({ open, onOpenChange, clients, createUrl }: Props) {
    const { t } = useTranslation();
    const form = useForm({
        title: '',
        type: 'direct' as string,
        message: '',
        participants: [] as { participant_type: string; participant_id: number }[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(createUrl, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    const portalClients = clients.filter((c) => c.portal_user);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('ai.conversations.new_conversation')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="conv-title">{t('ai.conversations.title')}</Label>
                        <Input
                            id="conv-title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            placeholder={t('ai.conversations.title_placeholder')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('ai.conversations.type')}</Label>
                        <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="direct">{t('ai.conversations.type_direct')}</SelectItem>
                                <SelectItem value="group">{t('ai.conversations.type_group')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('ai.conversations.select_client')}</Label>
                        <Select onValueChange={(v) => {
                            const client = clients.find((c) => c.id === Number(v));
                            if (client?.portal_user) {
                                form.setData('participants', [{
                                    participant_type: 'Modules\\AilesInvisibles\\Models\\ClientUser',
                                    participant_id: client.portal_user.id,
                                }]);
                            }
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('ai.conversations.select_client')} />
                            </SelectTrigger>
                            <SelectContent>
                                {portalClients.map((client) => (
                                    <SelectItem key={client.id} value={String(client.id)}>
                                        {client.name}
                                        {client.company_name ? ` (${client.company_name})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="conv-msg">{t('ai.conversations.message')}</Label>
                        <Textarea
                            id="conv-msg"
                            value={form.data.message}
                            onChange={(e) => form.setData('message', e.target.value)}
                            placeholder={t('ai.conversations.type_message')}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('ai.conversations.cancel')}
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {t('ai.conversations.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
