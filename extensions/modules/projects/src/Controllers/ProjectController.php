<?php

namespace Modules\Projects\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Projects\Http\Requests\StoreProjectRequest;
use Modules\Projects\Http\Requests\UpdateProjectRequest;
use Modules\Projects\Models\Project;

class ProjectController
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Project::class);

        $projects = Project::query()
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'priority' => $project->priority,
                'due_date' => $project->due_date?->toISOString(),
                'color' => $project->color,
                'created_at' => $project->created_at->toISOString(),
            ]);

        return Inertia::render('projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Gate::authorize('create', Project::class);

        Project::create([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'status' => 'active',
            'priority' => $request->validated('priority', 'medium'),
            'due_date' => $request->validated('due_date'),
            'color' => $request->validated('color'),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project created.')]);

        return to_route('projects.index', ['current_team' => $request->route('current_team')]);
    }

    public function show(int|string $project): Response
    {
        $project = Project::findOrFail((int) $project);

        Gate::authorize('view', $project);

        return Inertia::render('projects/Show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'priority' => $project->priority,
                'due_date' => $project->due_date?->toISOString(),
                'color' => $project->color,
                'created_at' => $project->created_at->toISOString(),
                'updated_at' => $project->updated_at->toISOString(),
            ],
        ]);
    }

    public function update(UpdateProjectRequest $request, int|string $project): RedirectResponse
    {
        $project = Project::findOrFail((int) $project);

        Gate::authorize('update', $project);

        $project->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project updated.')]);

        return to_route('projects.show', [
            'current_team' => $request->route('current_team'),
            'project' => $project->id,
        ]);
    }

    public function destroy(int|string $project): RedirectResponse
    {
        $project = Project::findOrFail((int) $project);

        Gate::authorize('delete', $project);

        $project->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project deleted.')]);

        return to_route('projects.index', ['current_team' => request()->route('current_team')]);
    }
}
