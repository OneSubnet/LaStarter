import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            currentTeam: Team | null;
            teams: Team[];
            navigation: {
                title: string;
                href: string;
                icon: string | null;
                order: number;
            }[];
            theme: string | null;
            [key: string]: unknown;
        };
    }
}
