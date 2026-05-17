import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

export type ExtensionNavChild = {
    title: string;
    href: string;
    icon: string | null;
    order: number;
    group?: string | null;
};

export type ExtensionNavItem = {
    title: string;
    href?: string;
    icon: string | null;
    order: number;
    children?: ExtensionNavChild[];
};

export type SidebarNavItem = {
    label: string;
    icon: LucideIcon;
    href: string;
    permission?: string;
    badge?: number | null;
};

export type SidebarNavSection = {
    title?: string;
    items: SidebarNavItem[];
};

export type SidebarNavModule = {
    id: string;
    label: string;
    icon: LucideIcon;
    sections: SidebarNavSection[];
    urlPatterns: string[];
};
