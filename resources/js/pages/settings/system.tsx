import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronRight,
    Download,
    Loader2,
    Package,
    RefreshCw,
    Server,
    AlertTriangle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import type { SharedData } from '@/types';

type ExtensionUpdate = {
    identifier: string;
    current_version: string;
    latest_version: string;
};

type Props = {
    coreVersion: string;
    latestVersion: string | null;
    changelog: string | null;
    updateAvailable: boolean;
    extensionUpdates: ExtensionUpdate[];
};

export default function System({
    coreVersion,
    latestVersion,
    changelog,
    updateAvailable,
    extensionUpdates,
}: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage<SharedData>().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug;

    const [checkingCore, setCheckingCore] = useState(false);
    const [updatingCore, setUpdatingCore] = useState(false);
    const [checkingExtensions, setCheckingExtensions] = useState(false);
    const [updatingExtension, setUpdatingExtension] = useState<string | null>(
        null,
    );

    const handleCheckCore = useCallback(() => {
        if (!teamSlug) {
            return;
        }

        setCheckingCore(true);
        router.post(
            `/${teamSlug}/settings/system/check-core`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setCheckingCore(false),
            },
        );
    }, [teamSlug]);

    const handleUpdateCore = useCallback(() => {
        if (!teamSlug) {
            return;
        }

        setUpdatingCore(true);
        router.post(
            `/${teamSlug}/settings/system/update-core`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setUpdatingCore(false),
            },
        );
    }, [teamSlug]);

    const handleCheckExtensions = useCallback(() => {
        if (!teamSlug) {
            return;
        }

        setCheckingExtensions(true);
        router.post(
            `/${teamSlug}/settings/system/check-extensions`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setCheckingExtensions(false),
            },
        );
    }, [teamSlug]);

    const handleUpdateExtension = useCallback(
        (identifier: string) => {
            if (!teamSlug) {
                return;
            }

            setUpdatingExtension(identifier);
            router.post(
                `/${teamSlug}/settings/system/update-extension`,
                { identifier },
                {
                    preserveScroll: true,
                    onFinish: () => setUpdatingExtension(null),
                },
            );
        },
        [teamSlug],
    );

    return (
        <TeamSettingsLayout
            activeTab="System"
            breadcrumbs={[
                {
                    title: t('settings.system.title'),
                    href: teamSlug ? `/${teamSlug}/settings/system` : '',
                },
            ]}
        >
            <Head title={t('settings.system.title')} />

            <div className="space-y-6">
                {/* Core Platform */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Server className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>
                                        {t('settings.system.core_platform')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('settings.system.version')}: v
                                        {coreVersion}
                                    </CardDescription>
                                </div>
                            </div>
                            {updateAvailable ? (
                                <Badge variant="default">
                                    {t('settings.system.update_available', {
                                        version: latestVersion,
                                    })}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t('settings.system.up_to_date')}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {changelog && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <h4 className="mb-2 text-sm font-medium">
                                    {t('settings.system.changelog')}
                                </h4>
                                <div className="prose prose-sm max-h-48 overflow-y-auto text-muted-foreground">
                                    <pre className="font-sans text-sm whitespace-pre-wrap">
                                        {changelog}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <Guard permission="system.update">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCheckCore}
                                    disabled={checkingCore || updatingCore}
                                >
                                    {checkingCore ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {t('settings.system.check_updates')}
                                </Button>

                                {updateAvailable && (
                                    <Button
                                        size="sm"
                                        onClick={handleUpdateCore}
                                        disabled={updatingCore}
                                    >
                                        {updatingCore ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="mr-2 h-4 w-4" />
                                        )}
                                        {t('settings.system.update_core')}
                                    </Button>
                                )}
                            </div>
                        </Guard>
                    </CardContent>
                </Card>

                {/* Extension Updates */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>
                                        {t(
                                            'settings.system.extensions_updates',
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {extensionUpdates.length > 0
                                            ? t(
                                                  'settings.system.updates_count',
                                                  {
                                                      count: extensionUpdates.length,
                                                  },
                                              )
                                            : t('settings.system.no_updates')}
                                    </CardDescription>
                                </div>
                            </div>
                            <Guard permission="system.update">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCheckExtensions}
                                    disabled={checkingExtensions}
                                >
                                    {checkingExtensions ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {t('settings.system.check_updates')}
                                </Button>
                            </Guard>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {extensionUpdates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <CheckCircle2 className="mb-2 h-8 w-8" />
                                <p className="text-sm">
                                    {t('settings.system.no_updates')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {extensionUpdates.map((ext) => (
                                    <div
                                        key={ext.identifier}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {ext.identifier}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    v{ext.current_version}{' '}
                                                    <ChevronRight className="inline h-3 w-3" />{' '}
                                                    v{ext.latest_version}
                                                </p>
                                            </div>
                                        </div>
                                        <Guard permission="system.update">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdateExtension(
                                                        ext.identifier,
                                                    )
                                                }
                                                disabled={
                                                    updatingExtension ===
                                                    ext.identifier
                                                }
                                            >
                                                {updatingExtension ===
                                                ext.identifier ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="mr-2 h-4 w-4" />
                                                )}
                                                {t('settings.system.update')}
                                            </Button>
                                        </Guard>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Compatibility Warning */}
                {updateAvailable && extensionUpdates.length > 0 && (
                    <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                <CardTitle className="text-yellow-600">
                                    {t(
                                        'settings.system.compatibility_warnings',
                                    )}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {t('settings.system.incompatible_extensions')}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </TeamSettingsLayout>
    );
}
