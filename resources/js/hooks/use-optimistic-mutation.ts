import { router } from '@inertiajs/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '@/contexts';

// ── Types ──────────────────────────────────────────────

type MutationOptions<TData, TError> = {
    mutationFn: (data: TData) => Promise<void>;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    invalidateQueries?: string[][];
    optimisticUpdateQueries?: string[][];
    getOptimisticData?: (old: unknown, data: TData) => unknown;
};

// ── Hook ───────────────────────────────────────────────

/**
 * Generic hook for optimistic mutations with TanStack Query
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useOptimisticMutation({
 *   mutationFn: (data) => router.patch('/api/endpoint', data),
 *   optimisticUpdateQueries: [['projects'], ['project', data.id]],
 *   getOptimisticData: (old, data) => ({ ...old, ...data }),
 *   invalidateQueries: [['projects']],
 * });
 * ```
 */
export function useOptimisticMutation<TData, TError = Error>(
    options: MutationOptions<TData, TError>,
) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: options.mutationFn,
        onMutate: async (data) => {
            // Cancel outgoing refetches
            const cancelPromises = (options.optimisticUpdateQueries ?? []).map(
                (queryKey) => queryClient.cancelQueries({ queryKey }),
            );
            await Promise.all(cancelPromises);

            // Snapshot previous values
            const previousData = (options.optimisticUpdateQueries ?? []).map(
                (queryKey) => ({
                    queryKey,
                    data: queryClient.getQueryData(queryKey),
                }),
            );

            // Optimistically update
            if (options.getOptimisticData) {
                (options.optimisticUpdateQueries ?? []).forEach((queryKey) => {
                    queryClient.setQueryData(queryKey, (old: unknown) =>
                        options.getOptimisticData!(old, data),
                    );
                });
            }

            return { previousData };
        },
        onError: (error, data, context) => {
            // Rollback on error
            context?.previousData.forEach(({ queryKey, data }) => {
                queryClient.setQueryData(queryKey, data);
            });

            options.onError?.(error as TError);
        },
        onSuccess: (data) => {
            // Invalidate related queries
            (options.invalidateQueries ?? []).forEach((queryKey) => {
                queryClient.invalidateQueries({ queryKey });
            });

            options.onSuccess?.(data as TData);
        },
    });

    return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
}

// ── Team-scoped Mutations ───────────────────────────────

/**
 * Hook for mutations that are scoped to the current team
 * Automatically includes team slug in URL and handles team context
 */
export function useTeamMutation<
    TData extends { team_slug?: string },
    TError = Error,
>(endpoint: string, method: 'post' | 'patch' | 'put' | 'delete' = 'post') {
    const { currentTeam } = useTeam();

    return useOptimisticMutation<TData, TError>({
        mutationFn: async (data) => {
            if (!currentTeam) {
                throw new Error('No current team');
            }

            const url = `/${currentTeam.slug}${endpoint}`;

            if (method === 'post') {
                await router.post(url, data);
            } else if (method === 'patch' || method === 'put') {
                await router[method](url, data);
            } else if (method === 'delete') {
                await router.delete(url, { data });
            }
        },
    });
}
