import { router } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';
import type { User, UserContextValue, UserProviderProps } from '@/types';

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
    children,
    initialUser = null,
}: UserProviderProps & { initialUser?: User | null }) {
    const queryClient = useQueryClient();

    // Query for user data (starts with initial data, can be refetched)
    const { data: user, isLoading } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            // Fetch fresh data from server
            const response = await fetch('/api/user');

            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }

            return response.json() as Promise<User>;
        },
        initialData: initialUser,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Update user mutation with optimistic update
    const updateUserMutation = useMutation({
        mutationFn: async (data: Partial<User>) => {
            // Optimistic update
            queryClient.setQueryData(['user'], (old: User | null) =>
                old ? { ...old, ...data } : null,
            );

            // Server update
            const response = await fetch('/settings/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Inertia': 'true',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                // Rollback on error
                throw new Error('Failed to update user');
            }

            return data;
        },
        onError: (error) => {
            console.error('Failed to update user:', error);
            // Rollback handled by TanStack Query automatically
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data: {
            name?: string;
            email?: string;
            locale?: string;
        }) => {
            // Optimistic update
            const previousUser = queryClient.getQueryData<User>(['user']);
            queryClient.setQueryData(['user'], (old: User | null) =>
                old ? { ...old, ...data } : null,
            );

            try {
                await router.patch('/settings/profile', data, {
                    preserveScroll: true,
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user'] });
                    },
                });
            } catch (error) {
                // Rollback
                queryClient.setQueryData(['user'], previousUser);

                throw error;
            }
        },
    });

    // Change password mutation (no optimistic update for security)
    const changePasswordMutation = useMutation({
        mutationFn: async (data: {
            current_password: string;
            password: string;
            password_confirmation: string;
        }) => {
            await router.patch('/settings/security', data, {
                preserveScroll: true,
            });
        },
    });

    const value = useMemo<UserContextValue>(
        () => ({
            user: user ?? null,
            isLoading,
            updateUser: (data) =>
                updateUserMutation.mutateAsync(data).then(() => undefined),
            updateProfile: (data) =>
                updateProfileMutation.mutateAsync(data).then(() => undefined),
            changePassword: (data) =>
                changePasswordMutation.mutateAsync(data).then(() => undefined),
        }),
        [
            user,
            isLoading,
            updateUserMutation,
            updateProfileMutation,
            changePasswordMutation,
        ],
    );

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

// ── Hook ───────────────────────────────────────────────

export function useUser() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }

    return context;
}

// ── Convenience Hooks ───────────────────────────────────

export function useUserId() {
    const { user } = useUser();

    return user?.id ?? null;
}

export function useUserName() {
    const { user } = useUser();

    return user?.name ?? '';
}

export function useUserEmail() {
    const { user } = useUser();

    return user?.email ?? '';
}

export function useUserLocale() {
    const { user } = useUser();

    return (user as { locale?: string } | null)?.locale ?? 'en';
}
