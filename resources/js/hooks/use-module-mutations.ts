/**
 * Example module-specific mutations hook
 * This demonstrates how modules can create their own optimistic mutation hooks
 *
 * @example
 * ```tsx
 * // In your module's pages/components
 * const { createProject, updateProject, deleteProject } = useProjectMutations();
 * ```
 */

import { router } from '@inertiajs/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentTeamSlug } from '@/contexts';

// ── Types ──────────────────────────────────────────────

export type Project = {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'archived';
    team_id: number;
    created_at: string;
    updated_at: string;
};

export type CreateProjectData = {
    name: string;
    description?: string;
};

export type UpdateProjectData = Partial<{
    name: string;
    description: string;
    status: Project['status'];
}>;

// ── Hook ───────────────────────────────────────────────

/**
 * Hook for project mutations with optimistic updates
 *
 * Usage in module pages:
 * ```tsx
 * import { useProjectMutations } from '@/hooks/use-module-mutations';
 *
 * function ProjectForm({ project, onSuccess }) {
 *   const { updateProject } = useProjectMutations();
 *
 *   const handleSubmit = (data) => {
 *     updateProject(
 *       { id: project.id, ...data },
 *       { onSuccess: () => router.visit(`/projects/${project.id}`) }
 *     );
 *   };
 * }
 * ```
 */
export function useProjectMutations() {
    const queryClient = useQueryClient();
    const teamSlug = useCurrentTeamSlug();

    // Create project with optimistic update
    const createProject = useMutation({
        mutationFn: async (data: CreateProjectData) => {
            // Optimistic update - add to projects list
            queryClient.setQueryData(
                ['projects', { team: teamSlug }],
                (old: Project[] | undefined) => {
                    const newProject: Project = {
                        id: Date.now(), // Temporary ID
                        name: data.name,
                        description: data.description ?? null,
                        status: 'active',
                        team_id: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    return [...(old ?? []), newProject];
                },
            );

            try {
                await router.post(`/${teamSlug}/projects`, data);
            } catch (error) {
                // Rollback on error
                queryClient.invalidateQueries({ queryKey: ['projects'] });

                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    // Update project with optimistic update
    const updateProject = useMutation({
        mutationFn: async ({
            id,
            ...data
        }: UpdateProjectData & { id: number }) => {
            // Optimistic update
            queryClient.setQueryData(
                ['project', id],
                (old: Project | undefined) =>
                    old ? { ...old, ...data } : null,
            );

            queryClient.setQueryData(
                ['projects', { team: teamSlug }],
                (old: Project[] | undefined) =>
                    old?.map((p) => (p.id === id ? { ...p, ...data } : p)),
            );

            try {
                await router.patch(`/${teamSlug}/projects/${id}`, data);
            } catch (error) {
                // Rollback
                queryClient.invalidateQueries({ queryKey: ['project', id] });
                queryClient.invalidateQueries({ queryKey: ['projects'] });

                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    // Delete project with optimistic update
    const deleteProject = useMutation({
        mutationFn: async (id: number) => {
            // Optimistic update - remove from list
            queryClient.setQueryData(
                ['projects', { team: teamSlug }],
                (old: Project[] | undefined) => old?.filter((p) => p.id !== id),
            );

            try {
                await router.delete(`/${teamSlug}/projects/${id}`);
            } catch (error) {
                // Rollback
                queryClient.invalidateQueries({ queryKey: ['projects'] });

                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.visit(`/${teamSlug}/projects`);
        },
    });

    return {
        createProject: createProject.mutateAsync,
        updateProject: updateProject.mutateAsync,
        deleteProject: deleteProject.mutateAsync,
        isCreating: createProject.isPending,
        isUpdating: updateProject.isPending,
        isDeleting: deleteProject.isPending,
    };
}

// ── Template for Other Modules ─────────────────────────

/**
 * Template for creating similar hooks in other modules
 *
 * 1. Copy this file to your module's hooks directory
 * 2. Rename types (e.g., Project -> YourEntity)
 * 3. Update endpoints to match your module's routes
 * 4. Adjust query keys to match your data structure
 *
 * @example
 * ```tsx
 * // extensions/modules/crm/hooks/use-client-mutations.ts
 * export function useClientMutations() {
 *   // ... similar structure for Client entities
 * }
 * ```
 */
