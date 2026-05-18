import { router, usePage } from '@inertiajs/react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { timeAgo } from '@/lib/format';
import type { SharedData, NotificationItem } from '@/types';

function getNotificationUrl(data: Record<string, unknown> | null): string | undefined {
    return data?.['url'] as string | undefined;
}

function NotificationRow({
    notification,
    onRead,
}: {
    notification: NotificationItem;
    onRead: (id: string) => void;
}) {
    const { t } = useTranslation();
    const isUnread = notification.read_at === null;
    const url = getNotificationUrl(notification.data);

    return (
        <button
            type="button"
            aria-label={notification.title || t('notifications.title')}
            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent ${isUnread ? 'bg-accent/50' : ''}`}
            onClick={() => {
                if (isUnread) {
                    onRead(notification.id);
                } else if (url) {
                    router.visit(url);
                }
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <span
                    className={`text-sm ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}
                >
                    {notification.title}
                </span>
                {notification.created_at && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(notification.created_at)}
                    </span>
                )}
            </div>
            {notification.body && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.body}
                </p>
            )}
            {isUnread && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                    <Check className="h-3 w-3" />
                    {t('notifications.mark_read')}
                </div>
            )}
            {!isUnread && url && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    {t('notifications.open')}
                </div>
            )}
        </button>
    );
}

export function NotificationBell() {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const unreadCount = page.props.unreadNotifications;
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);

    const teamSlug = page.props.currentTeam?.slug ?? '';

    const fetchNotifications = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/${teamSlug}/notifications`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data?.props?.notifications?.data ?? []);
            }
        } catch {
            // silent
        }

        setLoading(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);

        if (isOpen) {
            fetchNotifications();
        }
    };

    const handleMarkRead = (id: string) => {
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
            ),
        );

        router.post(
            `/${teamSlug}/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const url = getNotificationUrl(notification?.data ?? null);
                    if (url) {
                        setOpen(false);
                        router.visit(url);
                    } else {
                        router.reload({ only: ['unreadNotifications'] });
                    }
                },
            },
        );
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
            })),
        );

        router.post(
            `/${teamSlug}/notifications/read-all`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['unreadNotifications'] });
                },
            },
        );
    };

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
                <DrawerHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <DrawerTitle>{t('notifications.title')}</DrawerTitle>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={handleMarkAllRead}
                        >
                            <Check className="mr-1 h-3 w-3" />
                            {t('notifications.mark_all_read')}
                        </Button>
                    )}
                </DrawerHeader>
                <Separator />
                <ScrollArea className="flex-1 px-2 py-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="space-y-1">
                            {notifications.map((n) => (
                                <NotificationRow
                                    key={n.id}
                                    notification={n}
                                    onRead={handleMarkRead}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8" />
                            <p className="text-sm">
                                {t('notifications.empty')}
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    );
}
