# Contexts & Hooks - User & Team Management

This directory provides React Context and TanStack Query integration for user and team management with optimistic updates.

## Features

- **UserContext**: Provides user data and mutations throughout the app
- **TeamContext**: Provides team data and mutations throughout the app
- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Type-Safe**: Full TypeScript support
- **Reusable Hooks**: Easy-to-use hooks for common operations

## Installation

The contexts are already set up in `app.tsx`. Just use the hooks in your components.

## Usage

### User Context

```tsx
import { useUser, useUserName, useUserEmail } from '@/contexts';

function UserProfile() {
    const { user, updateUser } = useUser();
    const name = useUserName();

    const handleUpdate = async () => {
        await updateUser({ name: 'New Name' });
        // UI updates immediately with optimistic update!
    };

    return <div>Welcome, {name}</div>;
}
```

### Team Context

```tsx
import { useTeam, useCurrentTeamSlug, useTeams } from '@/contexts';

function TeamSwitcher() {
    const { currentTeam, teams, switchTeam } = useTeam();
    const teamSlug = useCurrentTeamSlug();

    const handleSwitch = async (slug: string) => {
        await switchTeam(slug);
        // Optimistic update + redirect
    };

    return (
        <select value={teamSlug} onChange={(e) => handleSwitch(e.target.value)}>
            {teams.map((team) => (
                <option key={team.id} value={team.slug}>
                    {team.name}
                </option>
            ))}
        </select>
    );
}
```

### Optimistic Mutations in Modules

```tsx
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useCurrentTeamSlug } from '@/contexts';

function ProjectForm({ project }) {
    const teamSlug = useCurrentTeamSlug();

    const { mutate: updateProject, isLoading } = useOptimisticMutation({
        mutationFn: (data) =>
            router.patch(`/${teamSlug}/projects/${project.id}`, data),
        optimisticUpdateQueries: [['projects'], ['project', project.id]],
        getOptimisticData: (old, data) => ({ ...old, ...data }),
        invalidateQueries: [['projects']],
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                updateProject({ name: 'New Name' });
            }}
        >
            <input name="name" defaultValue={project.name} />
            <button disabled={isLoading}>Save</button>
        </form>
    );
}
```

## Available Hooks

### User Context

- `useUser()` - Full user context
- `useUserId()` - Current user ID
- `useUserName()` - Current user name
- `useUserEmail()` - Current user email
- `useUserLocale()` - Current user locale

### Team Context

- `useTeam()` - Full team context
- `useCurrentTeamId()` - Current team ID
- `useCurrentTeamSlug()` - Current team slug
- `useCurrentTeamName()` - Current team name
- `useTeams()` - All user's teams

### Optimistic Mutations

- `useOptimisticMutation()` - Generic optimistic mutation hook
- `useTeamMutation()` - Team-scoped mutations
- `useProjectMutations()` - Example module mutations

## Module Development

When creating a new module, follow this pattern:

1. **Create module-specific mutation hooks** in `extensions/modules/your-module/resources/js/hooks/`:

```tsx
// extensions/modules/crm/resources/js/hooks/use-client-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from '@inertiajs/react';
import { useCurrentTeamSlug } from '@/contexts';

export function useClientMutations() {
    const queryClient = useQueryClient();
    const teamSlug = useCurrentTeamSlug();

    const createClient = useMutation({
        mutationFn: async (data: CreateClientData) => {
            // Optimistic update
            queryClient.setQueryData(
                ['clients'],
                (old: Client[] | undefined) => [
                    ...(old ?? []),
                    { id: Date.now(), ...data, team_id: 0 },
                ],
            );

            try {
                await router.post(`/${teamSlug}/crm/clients`, data);
            } catch {
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                throw error;
            }
        },
    });

    return { createClient: createClient.mutateAsync };
}
```

2. **Create data fetching hooks**:

```tsx
// extensions/modules/crm/resources/js/hooks/use-clients.ts
import { useQuery } from '@tanstack/react-query';
import { useCurrentTeamSlug } from '@/contexts';

export function useClients() {
    const teamSlug = useCurrentTeamSlug();
    const page = usePage();

    return useQuery({
        queryKey: ['clients', { team: teamSlug }],
        queryFn: async () => (page.props.clients as Client[]) ?? [],
        initialData: (page.props.clients as Client[]) ?? [],
    });
}
```

3. **Use in your components**:

```tsx
import { useClients, useClientMutations } from '../hooks';

function ClientsList() {
    const { data: clients } = useClients();
    const { createClient, isCreating } = useClientMutations();

    return (
        <div>
            {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
            ))}
            <button
                onClick={() => createClient({ name: 'New Client' })}
                disabled={isCreating}
            >
                Add Client
            </button>
        </div>
    );
}
```

## Query Keys Convention

Use consistent query keys for cache invalidation:

```tsx
// Single item
['entity-type', id][('entity-type', { team: slug, id })][
    // Lists
    'entity-type'
][('entity-type', { team: slug })][
    ('entity-type', { team: slug, status: 'active' })
];
```

## Best Practices

1. **Always use optimistic updates for UI that responds immediately**
2. **Include rollback logic in error handling**
3. **Invalidate related queries after successful mutations**
4. **Use TypeScript for type safety**
5. **Keep mutations focused - one mutation per action**
