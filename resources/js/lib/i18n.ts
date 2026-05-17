import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const extensionLocales = import.meta.glob(
    '../../../extensions/modules/*/resources/locales/*.json',
    { eager: true },
);

function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
): void {
    for (const key of Object.keys(source)) {
        const sv = source[key];
        const tv = target[key];

        if (
            sv &&
            typeof sv === 'object' &&
            !Array.isArray(sv) &&
            tv &&
            typeof tv === 'object' &&
            !Array.isArray(tv)
        ) {
            deepMerge(
                tv as Record<string, unknown>,
                sv as Record<string, unknown>,
            );
        } else {
            target[key] = sv;
        }
    }
}

function buildBundle(
    locale: string,
    base: Record<string, unknown>,
): Record<string, unknown> {
    const bundle = structuredClone(base);

    for (const path of Object.keys(extensionLocales)) {
        const match = path.match(
            /extensions[/\\]modules[/\\]([^/\\]+)[/\\]resources[/\\]locales[/\\]([a-z]{2}(?:-[A-Z]{2})?)\.json$/,
        );

        if (match && match[2] === locale) {
            const mod = extensionLocales[path] as {
                default: Record<string, unknown>;
            };
            const translations = mod.default ?? mod;
            deepMerge(bundle, translations);
        }
    }

    return bundle;
}

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: buildBundle('en', en as Record<string, unknown>) },
        fr: { translation: buildBundle('fr', fr as Record<string, unknown>) },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;
