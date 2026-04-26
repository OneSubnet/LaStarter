<?php

namespace Modules\Projects\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Projects\Models\Project;

class ProjectController
{
    public function index(Request $request): Response
    {
        Gate::authorize('project.view');

        $projects = Project::query()
            ->when($request->input('search'), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->orderBy('updated_at', 'desc')
            ->paginate(15)
            ->through(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'visibility' => $project->visibility,
                'deadline' => $project->deadline?->toDateString(),
                'created_at' => $project->created_at->toDateString(),
            ]);

        return Inertia::render('projects/Index', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('project.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,completed,on_hold,cancelled',
            'visibility' => 'nullable|string|in:private,public',
            'deadline' => 'nullable|date',
        ]);

        Project::create([
            ...$validated,
            'status' => $validated['status'] ?? 'active',
            'visibility' => $validated['visibility'] ?? 'private',
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => __('messages.project_created'),
        ]);
    }

    public function show(Project $project): Response
    {
        Gate::authorize('project.view');

        return Inertia::render('projects/Show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'visibility' => $project->visibility,
                'deadline' => $project->deadline?->toDateString(),
                'created_at' => $project->created_at->toDateString(),
                'updated_at' => $project->updated_at->toDateString(),
            ],
        ]);
    }

    public function update(Request $request, Project $project)
    {
        Gate::authorize('project.update');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,completed,on_hold,cancelled',
            'visibility' => 'nullable|string|in:private,public',
            'deadline' => 'nullable|date',
        ]);

        $project->update($validated);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => __('messages.project_updated'),
        ]);
    }

    public function destroy(Project $project)
    {
        Gate::authorize('project.delete');

        $project->delete();

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => __('messages.project_deleted'),
        ]);
    }
}
