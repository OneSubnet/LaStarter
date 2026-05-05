<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\ApiController;
use App\Http\Api\Resources\Team\TeamCollection;
use App\Http\Api\Resources\Team\TeamResource;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamApiController extends ApiController
{
    /**
     * Display a listing of teams.
     */
    public function index(Request $request): JsonResponse
    {
        $teams = Team::query()
            ->when($request->query('search'), fn ($q, $search) => $q->search($search))
            ->paginate($request->query('per_page', 15));

        return $this->paginated(new TeamCollection($teams));
    }

    /**
     * Display the specified team.
     */
    public function show(Team $team): JsonResponse
    {
        $this->authorize('view', $team);

        return $this->success(new TeamResource($team));
    }

    /**
     * Store a newly created team.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Team::class);

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_personal' => ['boolean'],
        ]);

        $team = Team::create($request->only(['name', 'is_personal']));

        return $this->created(new TeamResource($team), 'Team created successfully.');
    }

    /**
     * Update the specified team.
     */
    public function update(Request $request, Team $team): JsonResponse
    {
        $this->authorize('update', $team);

        $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'is_personal' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'locale' => ['sometimes', 'string', 'in:en,fr'],
        ]);

        $team->update($request->only(['name', 'is_personal', 'is_active', 'locale']));

        return $this->success(new TeamResource($team), 'Team updated successfully.');
    }

    /**
     * Remove the specified team.
     */
    public function destroy(Team $team): JsonResponse
    {
        $this->authorize('delete', $team);

        $team->delete();

        return $this->success(null, 'Team deleted successfully.');
    }
}
