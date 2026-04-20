<?php

namespace App\Actions\Members;

use App\Models\Team;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class MapTeamMembers
{
    public function handle(Team $team): array
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $members = $team->members()->get();

        $memberIds = $members->pluck('id')->toArray();

        $roleAssignments = Role::where('roles.team_id', $team->id)
            ->join('model_has_roles', function ($join) use ($memberIds, $team) {
                $join->on('roles.id', '=', 'model_has_roles.role_id')
                    ->where('model_has_roles.model_type', '=', 'App\\Models\\User')
                    ->where('model_has_roles.team_id', '=', $team->id)
                    ->whereIn('model_has_roles.model_id', $memberIds);
            })
            ->select('model_has_roles.model_id', 'roles.name')
            ->get()
            ->groupBy('model_id')
            ->map(fn ($items) => $items->pluck('name'));

        return $members->map(function ($member) use ($roleAssignments) {
            $roleValue = $member->pivot->role instanceof \BackedEnum
                ? $member->pivot->role->value
                : $member->pivot->role;

            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'avatar' => $member->avatar ?? null,
                'role' => $roleValue,
                'role_label' => ucfirst($roleValue),
                'roles' => $roleAssignments->get($member->id, []),
                'status' => $member->pivot->status,
                'joined_at' => $member->pivot->joined_at?->toISOString(),
            ];
        })->toArray();
    }
}
