import { createInertiaApp, router } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import i18n from 'i18next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/contexts';
import { initializeTheme } from '@/hooks/use-appearance';
import type { User } from '@/types/auth';
import type { Team } from '@/types/teams';

import '@/lib/i18n';

import { setUrlDefaults } from '@/wayfinder';

// Initialize Echo WebSocket client-side only (SSR-safe)
if (typeof window !== 'undefined') {
    import('@/lib/echo');
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Scan all page directories at build time via Vite's import.meta.glob
const corePages = import.meta.glob('./pages/**/*.tsx');
const modulePages = import.meta.glob(
    '../../extensions/modules/*/resources/js/pages/**/*.tsx',
);
const themeOverrides = import.meta.glob(
    '../../extensions/themes/*/resources/js/overrides/**/*.tsx',
);
const extensionLocales = import.meta.glob(
    '../../extensions/modules/*/resources/locales/*.json',
);

function applyTheme(theme: string | null | undefined) {
    if (typeof document === 'undefined') {
        return;
    }

    const html = document.documentElement;

    html.classList.forEach((cls) => {
        if (cls.startsWith('theme-')) {
            html.classList.remove(cls);
        }
    });

    if (!theme) {
        return;
    }

    html.classList.add(`theme-${theme}`);
}

async function loadExtensionLocales(locale: string) {
    for (const path in extensionLocales) {
        const match = path.match(
            /extensions[/\\]modules[/\\]([^/\\]+)[/\\]resources[/\\]locales[/\\]([a-z]{2}(?:-[A-Z]{2})?)\.json$/,
        );

        if (match && match[2] === locale) {
            const mod = (await extensionLocales[path]()) as {
                default: Record<string, string>;
            };
            const ns = match[1];
            const translations = mod.default ?? mod;

            if (Object.keys(translations).length > 0) {
                i18n.addResourceBundle(locale, ns, translations, true, true);
            }
        }
    }
}

// Pre-build page map for O(1) resolution — core first, modules overwrite, themes overwrite (highest priority)
type PageLoader = () => Promise<{ default: ResolvedComponent }>;
const pageMap = new Map<string, PageLoader>();

function registerPages(
    globs: Record<string, () => Promise<unknown>>,
    pattern: RegExp,
    overwrite: boolean,
) {
    for (const path in globs) {
        const match = path.match(pattern);

        if (match && (overwrite || !pageMap.has(match[1]))) {
            pageMap.set(match[1], globs[path] as PageLoader);
        }
    }
}

registerPages(corePages, /^\.\/pages\/(.+)\.tsx$/, false);
registerPages(
    modulePages,
    /extensions\/modules\/[^/]+\/resources\/js\/pages\/(.+)\.tsx$/,
    true,
);
registerPages(
    themeOverrides,
    /extensions\/themes\/[^/]+\/resources\/js\/overrides\/(.+)\.tsx$/,
    true,
);

async function resolvePage(name: string): Promise<ResolvedComponent> {
    const loader = pageMap.get(name);

    if (!loader) {
        throw new Error(`Page not found: ${name}`);
    }

    const module = await loader();

    return module.default ?? module;
}

// Extract initial page data from the #app element (SSR-safe)
function getInitialPageData() {
    if (typeof document === 'undefined') {
        return { user: null, currentTeam: null, teams: [] };
    }

    const bootstrap = document.getElementById('app')?.dataset.page;

    if (!bootstrap) {
        return { user: null, currentTeam: null, teams: [] };
    }

    try {
        const page = JSON.parse(bootstrap);

        return {
            user: (page.props?.auth?.user as User) || null,
            currentTeam: (page.props?.currentTeam as Team | null) || null,
            teams: (page.props?.teams as Team[]) || [],
        };
    } catch {
        return { user: null, currentTeam: null, teams: [] };
    }
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePage(name),
    strictMode: true,
    withApp(app) {
        const initialData = getInitialPageData();

        return (
            <AppProvider
                initialUser={initialData.user}
                initialCurrentTeam={initialData.currentTeam}
                initialTeams={initialData.teams}
            >
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </AppProvider>
        );
    },
    progress: {
        color: 'hsl(var(--muted-foreground))',
    },
});

// This will set light / dark mode on load...
if (typeof document !== 'undefined') {
    initializeTheme();
}

// Set default URL parameters from Inertia shared props so route helpers
// auto-fill current_team when not explicitly provided.
router.on('navigate', (event) => {
    const team = event.detail.page.props.currentTeam as {
        slug?: string;
    } | null;

    if (team?.slug) {
        setUrlDefaults({ current_team: team.slug, team: team.slug });
    }

    const locale = event.detail.page.props.locale as string | undefined;

    if (locale && i18n.language !== locale) {
        i18n.changeLanguage(locale);
        loadExtensionLocales(locale).catch(console.error);
    }

    applyTheme(event.detail.page.props.theme as string | null | undefined);
});

// Also set on initial load
if (typeof document !== 'undefined') {
    const bootstrap = document.getElementById('app')?.dataset.page;

    if (bootstrap) {
        try {
            const page = JSON.parse(bootstrap);
            const team = page.props?.currentTeam as { slug?: string } | null;

            if (team?.slug) {
                setUrlDefaults({ current_team: team.slug, team: team.slug });
            }

            const locale = page.props?.locale as string | undefined;

            if (locale && i18n.language !== locale) {
                i18n.changeLanguage(locale);
                loadExtensionLocales(locale).catch(console.error);
            }

            applyTheme(page.props?.theme as string | null | undefined);
        } catch {
            // ignore
        }
    }
}
