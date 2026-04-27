import { router, usePage } from '@inertiajs/react';
import { Calculator, Calendar, FileText, FolderKanban, LayoutGrid, MessageSquare, Receipt, Settings, ShieldCheck, Users, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { dashboard } from '@/routes';
import {
    extensions,
    general,
    members,
    roles,
} from '@/routes/settings/team';

type ExtensionNavChild = {
    title: string;
    href: string;
    icon: string | null;
};

type ExtensionNavItem = {
    title: string;
    href?: string;
    icon: string | null;
    children?: ExtensionNavChild[];
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutGrid,
    FolderKanban,
    Settings,
    Users,
    ShieldCheck,
    MessageSquare,
    FileText,
    Calendar,
    Receipt,
    Calculator,
};

function IconFor({ name, ...props }: { name: string | null; className?: string }) {
    const Icon = name ? iconMap[name] : LayoutGrid;
    return Icon ? <Icon {...props} /> : <LayoutGrid {...props} />;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const page = usePage();
    const { t } = useTranslation();

    const teamSlug = (page.props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const extensionNav = (page.props.navigation as ExtensionNavItem[] | undefined) ?? [];

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const navItems = useMemo(() => {
        const items: { label: string; href: string; icon: string; group: string }[] = [];

        items.push({
            label: t('common.dashboard'),
            href: teamSlug ? dashboard(teamSlug).url : '/',
            icon: 'LayoutGrid',
            group: t('command.navigation'),
        });

        for (const ext of extensionNav) {
            if (ext.children) {
                for (const child of ext.children) {
                    items.push({
                        label: child.title,
                        href: child.href,
                        icon: child.icon ?? 'LayoutGrid',
                        group: ext.title,
                    });
                }
            } else if (ext.href) {
                items.push({
                    label: ext.title,
                    href: ext.href,
                    icon: ext.icon ?? 'LayoutGrid',
                    group: t('command.navigation'),
                });
            }
        }

        if (teamSlug) {
            items.push(
                { label: t('common.general'), href: general(teamSlug).url, icon: 'Settings', group: t('common.settings') },
                { label: t('common.members'), href: members(teamSlug).url, icon: 'Users', group: t('common.settings') },
                { label: t('common.roles'), href: roles(teamSlug).url, icon: 'ShieldCheck', group: t('common.settings') },
            );
        }

        return items;
    }, [teamSlug, extensionNav, t]);

    const actionItems = useMemo(() => {
        if (!teamSlug) return [];
        return [
            { label: t('command.new_invoice'), href: `/${teamSlug}/ailes-invisibles/invoices/create`, icon: 'Receipt' },
            { label: t('command.new_client'), href: `/${teamSlug}/ailes-invisibles/clients/create`, icon: 'Users' },
            { label: t('command.new_quote'), href: `/${teamSlug}/ailes-invisibles/quotes/create`, icon: 'FileText' },
            { label: t('command.new_event'), href: `/${teamSlug}/ailes-invisibles/events/create`, icon: 'Calendar' },
        ];
    }, [teamSlug, t]);

    const grouped = useMemo(() => {
        const map = new Map<string, typeof navItems>();
        for (const item of navItems) {
            if (!map.has(item.group)) map.set(item.group, []);
            map.get(item.group)!.push(item);
        }
        return map;
    }, [navItems]);

    const handleSelect = (href: string) => {
        setOpen(false);
        router.visit(href);
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen} title={t('command.title')} description={t('command.description')}>
            <CommandInput placeholder={t('command.placeholder')} />
            <CommandList>
                <CommandEmpty>{t('command.no_results')}</CommandEmpty>

                {actionItems.length > 0 && (
                    <>
                        <CommandGroup heading={t('command.actions')}>
                            {actionItems.map((item) => (
                                <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                                    <IconFor name={item.icon} className="h-4 w-4" />
                                    <span className="flex items-center gap-2">
                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                        {item.label}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {[...grouped.entries()].map(([group, items]) => (
                    <CommandGroup key={group} heading={group}>
                        {items.map((item) => (
                            <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                                <IconFor name={item.icon} className="h-4 w-4" />
                                <span>{item.label}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}

                {teamSlug && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={t('common.settings')}>
                            <CommandItem onSelect={() => handleSelect(general(teamSlug).url)}>
                                <Settings className="h-4 w-4" />
                                <span>{t('common.general')}</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleSelect(extensions(teamSlug).url)}>
                                <LayoutGrid className="h-4 w-4" />
                                <span>{t('common.extensions_and_themes')}</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
