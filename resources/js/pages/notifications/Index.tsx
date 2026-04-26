import { Head, router, usePage } from '@inertiajs/react';
import { Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { index as notificationsIndex, read, readAll } from '@/routes/notifications';

type NotificationItem = {
    id: number;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
};

type Props = {
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
    };
};

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export default function NotificationsIndex({ notifications }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | null)?.slug ?? '';

    const markRead = (id: number) => {
        router.post(
            read.url({ current_team: teamSlug, id }),
            {},
            { preserveScroll: true },
        );
    };

    const markAllRead = () => {
        router.post(
            readAll.url({ current_team: teamSlug }),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('common.dashboard'), href: teamSlug ? notificationsIndex(teamSlug).url : '/' },
                { title: t('notifications.title'), href: notificationsIndex(teamSlug).url },
            ]}
        >
            <Head title={t('notifications.title')} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
                    {notifications.data.length > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            <Check className="mr-1 size-4" />
                            {t('notifications.mark_all_read')}
                        </Button>
                    )}
                </div>

                {notifications.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Bell className="mb-4 size-12 opacity-40" />
                        <p>{t('notifications.empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.data.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => {
                                    if (!notification.read_at) markRead(notification.id);
                                    const url = notification.data?.url as string | undefined;
                                    if (url) router.visit(url);
                                }}
                                className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                                    notification.read_at ? 'opacity-60' : 'bg-muted/30'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{notification.title}</p>
                                        {notification.body && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {notification.body}
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {timeAgo(notification.created_at)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
