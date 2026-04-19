<?php

namespace Modules\Tasks\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Tasks\Models\Task;

class TaskController
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Task::class);

        $tasks = Task::query()
            ->with('project')
            ->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
            ->orderBy('due_date')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_date' => $task->due_date?->toISOString(),
                'project' => $task->project ? [
                    'id' => $task->project->id,
                    'name' => $task->project->name,
                ] : null,
            ]);

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Task::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'nullable|integer|exists:projects,id',
            'priority' => 'string|in:low,medium,high',
            'due_date' => 'nullable|date',
        ]);

        Task::create(array_merge($validated, ['status' => 'todo']));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task created.')]);

        return to_route('tasks.index', ['current_team' => $request->route('current_team')]);
    }

    public function update(Request $request, int|string $task): RedirectResponse
    {
        $task = Task::findOrFail((int) $task);

        Gate::authorize('update', $task);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|string|in:todo,in_progress,done',
            'priority' => 'sometimes|string|in:low,medium,high',
            'due_date' => 'nullable|date',
        ]);

        $task->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task updated.')]);

        return to_route('tasks.index', ['current_team' => $request->route('current_team')]);
    }

    public function destroy(Request $request, int|string $task): RedirectResponse
    {
        $task = Task::findOrFail((int) $task);

        Gate::authorize('delete', $task);

        $task->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task deleted.')]);

        return to_route('tasks.index', ['current_team' => $request->route('current_team')]);
    }
}
