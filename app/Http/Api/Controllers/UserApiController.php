<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\ApiController;
use App\Http\Api\Resources\User\UserCollection;
use App\Http\Api\Resources\User\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserApiController extends ApiController
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->when($request->query('search'), fn ($q, $search) => $q->search($search, 'name'))
            ->paginate($request->query('per_page', 15));

        return $this->paginated(new UserCollection($users));
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->success(new UserResource($user));
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'locale' => ['sometimes', 'string', 'in:en,fr'],
        ]);

        $user->update($request->only(['name', 'locale']));

        return $this->success(new UserResource($user), 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return $this->success(null, 'User deleted successfully.');
    }
}
