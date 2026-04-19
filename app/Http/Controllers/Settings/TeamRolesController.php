<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Roles\CreateRole;
use App\Actions\Roles\DeleteRole;
use App\Actions\Roles\UpdateRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\StoreRoleRequest;
use App\Http\Requests\Teams\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TeamRolesController extends Controller
{
    public function index(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('viewAny', Role::class);

        $teamRoles = Role::where('team_id', $team->id)
            ->with('permissions')
            ->get()
            ->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'is_protected' => $role->name === 'owner',
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'users_count' => $team->members()
                    ->whereHas('roles', fn ($q) => $q->where('roles.id', $role->id)->where('roles.team_id', $team->id))
                    ->count(),
            ]);

        $allPermissions = Permission::all()->map(fn ($permission) => [
            'name' => $permission->name,
            'module' => explode('.', $permission->name)[0],
        ])->groupBy('module');

        return Inertia::render('settings/team-roles', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
            ],
            'roles' => $teamRoles,
            'allPermissions' => $allPermissions,
        ]);
    }

    public function store(StoreRoleRequest $request, CreateRole $createRole): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('create', Role::class);

        $createRole->handle(
            $team->id,
            $request->validated('name'),
            $request->filled('permissions') ? $request->validated('permissions') : [],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return back();
    }

    public function update(UpdateRoleRequest $request, UpdateRole $updateRole): RedirectResponse
    {
        $roleId = $request->route('role');
        $role = Role::findOrFail($roleId);

        Gate::authorize('belongsToTeam', $role);
        Gate::authorize('update', $role);

        $updateRole->handle(
            $role,
            $request->validated('name'),
            $request->has('permissions') ? $request->validated('permissions') : null,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return back();
    }

    public function destroy(Request $request, DeleteRole $deleteRole): RedirectResponse
    {
        $roleId = $request->route('role');
        $role = Role::findOrFail($roleId);

        Gate::authorize('belongsToTeam', $role);
        Gate::authorize('delete', $role);

        $deleteRole->handle($role);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return back();
    }
}
