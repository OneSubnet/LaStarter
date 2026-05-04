import type { ReactNode } from 'react';
import type { User } from './auth';
import type { Team } from './teams';

// ── User Context Types ───────────────────────────────────────

export type UserContextValue = {
    user: User | null;
    isLoading: boolean;
    updateUser: (data: Partial<User>) => Promise<void>;
    updateProfile: (data: {
        name?: string;
        email?: string;
        locale?: string;
    }) => Promise<void>;
    changePassword: (data: {
        current_password: string;
        password: string;
        password_confirmation: string;
    }) => Promise<void>;
};

export type UserProviderProps = {
    children: ReactNode;
    initialUser?: User | null;
};

// ── Team Context Types ───────────────────────────────────────

export type TeamContextValue = {
    currentTeam: Team | null;
    teams: Team[];
    isLoading: boolean;
    switchTeam: (teamSlug: string) => Promise<void>;
    updateTeam: (data: Partial<Team>) => Promise<void>;
    refreshTeams: () => Promise<void>;
};

export type TeamProviderProps = {
    children: ReactNode;
    initialCurrentTeam?: Team | null;
    initialTeams?: Team[];
};

// ── App Provider Types ───────────────────────────────────────

export type AppProviderProps = {
    children: ReactNode;
    dehydratedState?: unknown;
};
