import { router } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';
import type { Team, TeamContextValue, TeamProviderProps } from '@/types';

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({
    children,
    initialCurrentTeam = null,
    initialTeams = [],
}: TeamProviderProps & {
    initialCurrentTeam?: Team | null;
    initialTeams?: Team[];
}) {
    const queryClient = useQueryClient();

    // Query for current team
    const { data: currentTeam, isLoading: isLoadingCurrent } = useQuery({
        queryKey: ['team', 'current'],
        queryFn: async () => {
            const response = await fetch('/api/current-team');

            if (!response.ok) {
                throw new Error('Failed to fetch team');
            }

            return response.json() as Promise<Team>;
        },
        initialData: initialCurrentTeam,
        staleTime: 1000 * 60 * 5,
    });

    // Query for all teams
    const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
            const response = await fetch('/api/teams');

            if (!response.ok) {
                throw new Error('Failed to fetch teams');
            }

            return response.json() as Promise<Team[]>;
        },
        initialData: initialTeams,
        staleTime: 1000 * 60 * 5,
    });

    // Switch team mutation
    const switchTeamMutation = useMutation({
        mutationFn: async (teamSlug: string) => {
            const targetTeam = teams.find((t) => t.slug === teamSlug);

            if (!targetTeam) {
                throw new Error('Team not found');
            }

            // Optimistic update
            queryClient.setQueryData(['team', 'current'], targetTeam);

            try {
                await router.post(
                    `/settings/teams/switch`,
                    { team: teamSlug },
                    {
                        onSuccess: () => {
                            window.location.href = `/${teamSlug}`;
                        },
                    },
                );
            } catch (error) {
                // Rollback
                queryClient.setQueryData(['team', 'current'], currentTeam);

                throw error;
            }
        },
    });

    // Update team mutation with optimistic update
    const updateTeamMutation = useMutation({
        mutationFn: async (data: Partial<Team>) => {
            if (!currentTeam) {
                throw new Error('No current team');
            }

            // Optimistic update
            const previousTeam = queryClient.getQueryData<Team>([
                'team',
                'current',
            ]);
            queryClient.setQueryData(['team', 'current'], (old: Team | null) =>
                old ? { ...old, ...data } : null,
            );

            // Also update in teams list
            queryClient.setQueryData(['teams'], (old: Team[] | undefined) =>
                old?.map((t) =>
                    t.id === currentTeam.id ? { ...t, ...data } : t,
                ),
            );

            try {
                await router.patch(
                    `/settings/${currentTeam.slug}/general`,
                    { name: data.name },
                    {
                        preserveScroll: true,
                        onError: () => {
                            // Rollback
                            queryClient.setQueryData(
                                ['team', 'current'],
                                previousTeam,
                            );
                        },
                    },
                );
            } catch (error) {
                // Rollback
                queryClient.setQueryData(['team', 'current'], previousTeam);
                queryClient.setQueryData(['teams'], (old: Team[] | undefined) =>
                    old?.map((t) =>
                        t.id === currentTeam.id ? previousTeam : t,
                    ),
                );

                throw error;
            }
        },
    });

    // Refresh teams query
    const refreshTeams = async () => {
        await queryClient.invalidateQueries({ queryKey: ['teams'] });
        await queryClient.invalidateQueries({ queryKey: ['team', 'current'] });
    };

    const value = useMemo<TeamContextValue>(
        () => ({
            currentTeam,
            teams,
            isLoading: isLoadingCurrent || isLoadingTeams,
            switchTeam: switchTeamMutation.mutateAsync,
            updateTeam: updateTeamMutation.mutateAsync,
            refreshTeams,
        }),
        [
            currentTeam,
            teams,
            isLoadingCurrent,
            isLoadingTeams,
            switchTeamMutation,
            updateTeamMutation,
        ],
    );

    return (
        <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
    );
}

// ── Hook ───────────────────────────────────────────────

export function useTeam() {
    const context = useContext(TeamContext);

    if (!context) {
        throw new Error('useTeam must be used within TeamProvider');
    }

    return context;
}

// ── Convenience Hooks ───────────────────────────────────

export function useCurrentTeamId() {
    const { currentTeam } = useTeam();

    return currentTeam?.id ?? null;
}

export function useCurrentTeamSlug() {
    const { currentTeam } = useTeam();

    return currentTeam?.slug ?? '';
}

export function useCurrentTeamName() {
    const { currentTeam } = useTeam();

    return currentTeam?.name ?? '';
}

export function useTeams() {
    const { teams } = useTeam();

    return teams;
}
