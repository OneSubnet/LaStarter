import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';

type SelectOption = { label: string; value: string };

interface SettingField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'switch' | 'number';
    options?: SelectOption[];
    default?: string | number | boolean;
}

interface Props {
    extensionIdentifier: string;
    settings: SettingField[];
    values: Record<string, string | number | boolean>;
}

export default function ExtensionSettingsForm({ extensionIdentifier, settings, values }: Props) {
    const { t } = useTranslation();
    const [form, setForm] = useState<Record<string, string | number | boolean>>(values);
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        router.put(`/settings/extensions/${extensionIdentifier}/settings`, form, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const renderField = (field: SettingField) => {
        const value = form[field.key] ?? field.default ?? '';

        switch (field.type) {
            case 'select':
                return (
                    <select
                        value={String(value)}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
            case 'switch':
                return (
                    <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(value)}
                        onClick={() => setForm({ ...form, [field.key]: !value })}
                        className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={String(value)}
                        onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                );
        }
    };

    if (settings.length === 0) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">{t('settings.extensions.configuration', 'Configuration')}</h3>
            {settings.map((field) => (
                <div key={field.key}>
                    <label className="text-sm font-medium">{field.label}</label>
                    {renderField(field)}
                </div>
            ))}
            <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
                <Save className="h-4 w-4" />
                {t('common.save', 'Save')}
            </button>
        </form>
    );
}
