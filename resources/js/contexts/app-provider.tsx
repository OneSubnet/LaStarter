import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import type { AppProviderProps } from '@/types';
import type { User } from '@/types/auth';
import type { Team } from '@/types/teams';
import { TeamProvider } from './team-context';
import { UserProvider } from './user-context';

export function AppProvider({
    children,
    initialUser,
    initialCurrentTeam,
    initialTeams,
}: AppProviderProps & {
    initialUser?: User | null;
    initialCurrentTeam?: Team | null;
    initialTeams?: Team[];
}) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutes
                        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <UserProvider initialUser={initialUser}>
                <TeamProvider
                    initialCurrentTeam={initialCurrentTeam}
                    initialTeams={initialTeams}
                >
                    {children}
                </TeamProvider>
            </UserProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
