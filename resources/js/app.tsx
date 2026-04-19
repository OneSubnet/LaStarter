import { createInertiaApp,  router } from '@inertiajs/react';
import type {ResolvedComponent} from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import QueryProvider from '@/lib/query-client';
import { setUrlDefaults } from '@/wayfinder';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Scan all page directories at build time via Vite's import.meta.glob
const corePages = import.meta.glob('./pages/**/*.tsx');
const modulePages = import.meta.glob(
    '../../extensions/modules/*/resources/js/pages/**/*.tsx',
);
const themeOverrides = import.meta.glob(
    '../../extensions/themes/*/resources/js/overrides/**/*.tsx',
);

async function resolvePage(name: string): Promise<ResolvedComponent> {
    // 1. Theme overrides (highest priority)
    for (const path in themeOverrides) {
        const match = path.match(
            /extensions\/themes\/([^/]+)\/resources\/js\/overrides\/(.+)\.tsx$/,
        );

        if (match && match[2] === name) {
            const module = (await themeOverrides[path]()) as {
                default: ResolvedComponent;
            };

            return module.default ?? module;
        }
    }

    // 2. Module pages
    for (const path in modulePages) {
        const match = path.match(
            /extensions\/modules\/([^/]+)\/resources\/js\/pages\/(.+)\.tsx$/,
        );

        if (match && match[2] === name) {
            const module = (await modulePages[path]()) as {
                default: ResolvedComponent;
            };

            return module.default ?? module;
        }
    }

    // 3. Core pages (fallback)
    const corePath = `./pages/${name}.tsx`;

    if (corePages[corePath]) {
        const module = (await corePages[corePath]()) as {
            default: ResolvedComponent;
        };

        return module.default ?? module;
    }

    throw new Error(`Page not found: ${name}`);
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePage(name),
    strictMode: true,
    withApp(app) {
        return (
            <QueryProvider>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </QueryProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
if (typeof document !== 'undefined') {
    initializeTheme();
}

// Set default URL parameters from Inertia shared props so route helpers
// auto-fill current_team when not explicitly provided.
router.on('navigate', (event) => {
    const team = event.detail.page.props.currentTeam as { slug?: string } | null;

    if (team?.slug) {
        setUrlDefaults({ current_team: team.slug, team: team.slug });
    }
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
        } catch {
            // ignore
        }
    }
}
