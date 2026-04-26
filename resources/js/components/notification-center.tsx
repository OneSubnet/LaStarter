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

type Notification = {
    id: number;
    type: string;
    title: string;
    body: string | null;
    data: { url?: string } | null;
    read_at: string | null;
    created_at: string;
};

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: number) => void }) {
    const isUnread = notification.read_at === null;

    return (
        <button
            type="button"
            className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent ${isUnread ? 'bg-accent/50' : ''}`}
            onClick={() => {
                if (isUnread) {
                    onRead(notification.id);
                } else if (notification.data?.url) {
                    router.visit(notification.data.url);
                }
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <span className={`text-sm ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                    {notification.title}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(notification.created_at)}
                </span>
            </div>
            {notification.body && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
            )}
            {isUnread && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                    <Check className="h-3 w-3" />
                    Mark as read
                </div>
            )}
            {!isUnread && notification.data?.url && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    Open
                </div>
            )}
        </button>
    );
}

export function NotificationBell() {
    const { t } = useTranslation();
    const page = usePage();
    const unreadCount = (page.props.unreadNotifications as number) ?? 0;
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const teamSlug = (page.props.currentTeam as { slug: string } | undefined)?.slug ?? '';

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/${teamSlug}/notifications`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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
        if (isOpen) fetchNotifications();
    };

    const handleMarkRead = async (id: number) => {
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
        );
        try {
            await fetch(`/${teamSlug}/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (notification?.data?.url) {
                setOpen(false);
                router.visit(notification.data.url);
            } else {
                router.reload({ only: ['unreadNotifications'] });
            }
        } catch {
            // silent
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
        );
        try {
            await fetch(`/${teamSlug}/notifications/read-all`, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            router.reload({ only: ['unreadNotifications'] });
        } catch {
            // silent
        }
    };

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
                <DrawerHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <DrawerTitle>{t('notifications.title')}</DrawerTitle>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAllRead}>
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
                                <NotificationItem key={n.id} notification={n} onRead={handleMarkRead} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8" />
                            <p className="text-sm">{t('notifications.empty')}</p>
                        </div>
                    )}
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    );
}
