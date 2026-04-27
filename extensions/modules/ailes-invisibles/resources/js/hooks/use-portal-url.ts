import { usePage } from '@inertiajs/react';

export function usePortalUrl() {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug?: string } | undefined)?.slug ?? '';

    return (path: string) => `/${teamSlug}/portal${path}`;
}
