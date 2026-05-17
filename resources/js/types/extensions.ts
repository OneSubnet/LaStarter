export type Extension = {
    id: number;
    identifier: string;
    name: string;
    type: 'module' | 'theme';
    version: string | null;
    description: string | null;
    author: string | null;
    state: string | null;
    is_enabled: boolean;
    permissions?: string[];
    has_routes?: boolean;
    has_migrations?: boolean;
    update_available?: boolean;
    latest_version?: string | null;
};

export type MarketplaceExtension = {
    identifier: string;
    name: string;
    description: string;
    type: 'module' | 'theme';
    version: string | null;
    author: string | null;
    owner: string | null;
    repo: string | null;
    github_url: string | null;
};

export type MarketplaceDetail = {
    identifier: string;
    name: string;
    description: string;
    type: 'module' | 'theme';
    version: string | null;
    author: string | null;
    owner: string;
    repo: string;
    github_url: string | null;
    permissions: string[];
};

export type SelectOption = { label: string; value: string };

export interface SettingField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'switch' | 'number';
    options?: SelectOption[];
    default?: string | number | boolean;
}
