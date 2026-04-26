import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Lock, Palette, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppearanceToggleTab from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortalLayout from '../../../layouts/portal/portal-layout';
import { usePortalUrl } from '../../../hooks/use-portal-url';
import type { PortalClient } from '@/types/ailes-invisibles';

type Tab = 'profile' | 'appearance' | 'security';
type Props = { client: PortalClient; tab?: Tab };

export default function Settings({ client, tab = 'profile' }: Props) {
    const { t, i18n } = useTranslation();
    const page = usePage();
    const locale = (page.props.locale as string) || i18n.language || 'en';
    const [activeTab, setActiveTab] = useState<Tab>(tab);

    const tabs: { id: Tab; label: string; icon: typeof User }[] = [
        { id: 'profile', label: t('settings.profile.title'), icon: User },
        { id: 'appearance', label: t('settings.appearance.title'), icon: Palette },
        { id: 'security', label: t('settings.security.title'), icon: Lock },
    ];

    return (
        <PortalLayout breadcrumbs={[{ title: t('layouts.account.title') }]}>
            <Head title={t('layouts.account.title')} />

            <div className="px-4 py-6">
                <Heading
                    title={t('layouts.account.title')}
                    description={t('layouts.account.description')}
                />

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="mt-6">
                    <TabsList>
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <TabsTrigger key={id} value={id} className="gap-1.5">
                                <Icon className="h-4 w-4" />
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="profile" className="mt-6 max-w-xl">
                        <ProfileTab client={client} />
                    </TabsContent>
                    <TabsContent value="appearance" className="mt-6 max-w-xl">
                        <AppearanceTab locale={locale} />
                    </TabsContent>
                    <TabsContent value="security" className="mt-6 max-w-xl">
                        <SecurityTab />
                    </TabsContent>
                </Tabs>
            </div>
        </PortalLayout>
    );
}

function ProfileTab({ client }: { client: PortalClient }) {
    const { t } = useTranslation();
    const p = usePortalUrl();

    const form = useForm({
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone ?? '',
        address_line1: client.address_line1 ?? '',
        city: client.city ?? '',
        postal_code: client.postal_code ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(p('/profile'), { preserveScroll: true });
    };

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={t('settings.profile.info_title')}
                description={t('settings.profile.info_description')}
            />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="first_name">{t('ai.clients.first_name')}</Label>
                        <Input
                            id="first_name"
                            value={form.data.first_name}
                            onChange={(e) => form.setData('first_name', e.target.value)}
                            placeholder={t('ai.clients.first_name')}
                        />
                        <InputError message={form.errors.first_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="last_name">{t('ai.clients.last_name')}</Label>
                        <Input
                            id="last_name"
                            value={form.data.last_name}
                            onChange={(e) => form.setData('last_name', e.target.value)}
                            placeholder={t('ai.clients.last_name')}
                        />
                        <InputError message={form.errors.last_name} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">{t('settings.profile.email_label')}</Label>
                    <Input id="email" value={client.email} disabled className="bg-muted" />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone">{t('ai.clients.phone')}</Label>
                    <Input
                        id="phone"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                        placeholder={t('ai.clients.phone')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="address">{t('ai.clients.address')}</Label>
                    <Input
                        id="address"
                        value={form.data.address_line1}
                        onChange={(e) => form.setData('address_line1', e.target.value)}
                        placeholder={t('ai.clients.address')}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="city">{t('ai.clients.city')}</Label>
                        <Input
                            id="city"
                            value={form.data.city}
                            onChange={(e) => form.setData('city', e.target.value)}
                            placeholder={t('ai.clients.city')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="postal_code">{t('ai.clients.postal_code')}</Label>
                        <Input
                            id="postal_code"
                            value={form.data.postal_code}
                            onChange={(e) => form.setData('postal_code', e.target.value)}
                            placeholder={t('ai.clients.postal_code')}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? t('settings.profile.saving') : t('settings.profile.save')}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function AppearanceTab({ locale: initialLocale }: { locale: string }) {
    const { t, i18n } = useTranslation();
    const p = usePortalUrl();
    const form = useForm({ locale: initialLocale });

    const changeLocale = (value: string) => {
        form.setData('locale', value);
        form.put(p('/locale'), {
            preserveScroll: true,
        });
        i18n.changeLanguage(value);
    };

    const availableLocales = [
        { value: 'en', label: 'English' },
        { value: 'fr', label: 'Français' },
    ];

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={t('settings.appearance.title')}
                description={t('settings.appearance.description')}
            />

            <div className="space-y-4">
                <AppearanceToggleTab />
            </div>

            <div className="space-y-2">
                <Label>{t('settings.profile.locale_label')}</Label>
                <Select value={form.data.locale} onValueChange={changeLocale}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {availableLocales.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>
                                {loc.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {t('settings.profile.locale_description')}
                </p>
            </div>
        </div>
    );
}

function SecurityTab() {
    const { t } = useTranslation();
    const p = usePortalUrl();

    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(p('/password'), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={t('settings.security.password_title')}
                description={t('settings.security.password_description')}
            />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="current_password">{t('settings.security.current_password_label')}</Label>
                    <Input
                        id="current_password"
                        type="password"
                        value={form.data.current_password}
                        onChange={(e) => form.setData('current_password', e.target.value)}
                        autoComplete="current-password"
                        placeholder={t('settings.security.current_password_placeholder')}
                    />
                    <InputError message={form.errors.current_password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">{t('settings.security.new_password_label')}</Label>
                    <Input
                        id="password"
                        type="password"
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.target.value)}
                        autoComplete="new-password"
                        placeholder={t('settings.security.new_password_placeholder')}
                    />
                    <InputError message={form.errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">{t('settings.security.confirm_password_label')}</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(e) => form.setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        placeholder={t('settings.security.confirm_password_placeholder')}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? t('settings.security.saving') : t('settings.security.save')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
