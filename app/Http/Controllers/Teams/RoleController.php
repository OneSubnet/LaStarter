<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Roles\CreateRole;
use App\Actions\Roles\DeleteRole;
use App\Actions\Roles\UpdateRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\StoreRoleRequest;
use App\Http\Requests\Teams\UpdateRoleRequest;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Team $team): Response
    {
        Gate::authorize('viewAny', Role::class);

        $teamRoles = Role::where('team_id', $team->id)
            ->with('permissions')
            ->get()
            ->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'users_count' => $team->members()
                    ->whereHas('roles', fn ($q) => $q->where('roles.id', $role->id)->where('roles.team_id', $team->id))
                    ->count(),
            ]);

        $allPermissions = Permission::all()->map(fn ($permission) => [
            'name' => $permission->name,
            'module' => explode('.', $permission->name)[0],
        ])->groupBy('module');

        return Inertia::render('teams/roles', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
            ],
            'roles' => $teamRoles,
            'allPermissions' => $allPermissions,
        ]);
    }

    public function store(StoreRoleRequest $request, Team $team, CreateRole $createRole): RedirectResponse
    {
        Gate::authorize('create', Role::class);

        $createRole->handle(
            $team->id,
            $request->validated('name'),
            $request->filled('permissions') ? $request->validated('permissions') : [],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }

    public function update(UpdateRoleRequest $request, Team $team, Role $role, UpdateRole $updateRole): RedirectResponse
    {
        Gate::authorize('update', $role);

        $updateRole->handle(
            $role,
            $request->validated('name'),
            $request->has('permissions') ? $request->validated('permissions') : null,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }

    public function destroy(Team $team, Role $role, DeleteRole $deleteRole): RedirectResponse
    {
        Gate::authorize('delete', $role);

        $deleteRole->handle($role);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }
}
