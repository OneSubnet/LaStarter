<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Modules\Lms\Data\Enrollment\EnrollmentRowData;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\Enrollment;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('lms.courses.manage_learners');
        $course = Course::findOrFail($request->route('course'));
        $enrollments = $course->enrollments()
            ->with('user')
            ->latest()
            ->get()
            ->map(fn ($e) => EnrollmentRowData::fromModel($e));

        return response()->json($enrollments);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.manage_learners');
        $course = Course::findOrFail($request->route('course'));
        $validated = $request->validate([
            'user_id' => 'nullable|integer|exists:users,id',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'create_user' => 'nullable|boolean',
            'role' => 'string|in:learner,instructor,assistant',
        ]);

        try {
            $userId = $validated['user_id'] ?? null;

            if (! $userId && ! empty($validated['email']) && ($validated['create_user'] ?? false)) {
                $existingUser = User::where('email', $validated['email'])->first();

                if ($existingUser) {
                    $userId = $existingUser->id;
                    if (! $existingUser->teams()->where('team_id', $course->team_id)->exists()) {
                        $existingUser->teams()->attach($course->team_id, [
                            'role' => 'member',
                            'status' => 'active',
                            'joined_at' => now(),
                        ]);
                    }
                } else {
                    $newUser = User::create([
                        'name' => $validated['name'] ?? explode('@', $validated['email'])[0],
                        'email' => $validated['email'],
                        'password' => Hash::make(str()->password(16)),
                    ]);
                    $newUser->teams()->attach($course->team_id, [
                        'role' => 'member',
                        'status' => 'active',
                        'joined_at' => now(),
                    ]);
                    $newUser->givePermissionTo(['lms.view', 'lms.courses.learn']);
                    Password::sendResetLink(['email' => $newUser->email]);
                    $userId = $newUser->id;
                }
            }

            if ($userId) {
                $exists = $course->enrollments()->where('user_id', $userId)->exists();
                if ($exists) {
                    Inertia::flash('toast', ['type' => 'error', 'message' => __('Learner already enrolled')]);

                    return back();
                }

                $enrolledUser = User::find($userId);
                if ($enrolledUser && ! $enrolledUser->hasPermissionTo('lms.courses.learn')) {
                    $enrolledUser->givePermissionTo(['lms.view', 'lms.courses.learn']);
                }
            }

            try {
                $course->enrollments()->create([
                    'team_id' => $course->team_id,
                    'user_id' => $userId,
                    'name' => $validated['name'] ?? null,
                    'email' => $validated['email'] ?? null,
                    'role' => $validated['role'],
                    'enrolled_at' => now(),
                ]);

                // Auto-unblock learner when enrolling in a new course
                if ($userId) {
                    Enrollment::where('user_id', $userId)
                        ->where('team_id', $course->team_id)
                        ->where('status', 'blocked')
                        ->update(['status' => 'active']);
                }
            } catch (QueryException $e) {
                if (str_contains($e->getMessage(), 'Unique violation') || str_contains($e->getMessage(), 'Duplicate entry') || str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                    Inertia::flash('toast', ['type' => 'error', 'message' => __('Learner already enrolled')]);

                    return back();
                }
                throw $e;
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner enrolled')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Enrollment creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function search(Request $request)
    {
        Gate::authorize('lms.courses.manage_learners');
        $teamId = auth()->user()->currentTeam->id;
        $search = $request->get('q', '');

        $users = User::whereHas('teams', fn ($q) => $q->where('teams.id', $teamId))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->limit(20)
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.manage_learners');
        $enrollment = Enrollment::findOrFail($request->route('enrollment'));

        try {
            $enrollment->delete();
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner removed')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Enrollment deletion failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }
}
