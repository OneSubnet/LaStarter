import type { Auth } from '@/types/auth';
import type { DashboardLayoutData, WidgetConfig } from '@/types/dashboard';
import type { Team } from '@/types/teams';
import type { FlashToast } from '@/types/ui';

export type NotificationItem = {
    id: string;
    title: string | null;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string | null;
};

export type AuditLogItem = {
    id: number;
    user: string | null;
    action: string;
    module: string | null;
    properties: Record<string, unknown> | null;
    created_at: string | null;
};

export type TeamMemberItem = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role_label: string;
    is_online: boolean;
};

export type FooterLink = {
    title: string;
    href: string;
};

export type ContextualSidebarItem = {
    title: string;
    href: string;
    icon: string;
    meta?: string;
    active: boolean;
};

export type ContextualSidebarSection = {
    title: string;
    items: ContextualSidebarItem[];
};

export type ContextualSidebar = {
    header?: {
        title: string;
        subtitle?: string;
        href?: string;
        progress?: number;
    } | null;
    sections: ContextualSidebarSection[];
};

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    currentTeam: Team | null;
    teams: Team[];
    navigation: Record<string, unknown>[];
    teamMembers: TeamMemberItem[];
    auditLogs: AuditLogItem[];
    theme: string | null;
    locale: string;
    fallbackLocale: string;
    availableLocales: string[];
    footerLinks: FooterLink[];
    unreadNotifications: number;
    recentNotifications: NotificationItem[];
    unreadMessageCount: number;
    availableWidgets: WidgetConfig[];
    dashboardLayout: DashboardLayoutData | null;
    coreVersion: string;
    coreUpdateAvailable: boolean;
    extensionUpdateCount: number;
    mailConfigured: boolean;
    contextualSidebar: ContextualSidebar | null;
    flash?: {
        toast?: FlashToast;
    };
    errors: Record<string, string>;
};
