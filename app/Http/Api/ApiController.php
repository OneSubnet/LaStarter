<?php

namespace App\Http\Api;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Base API Controller
 *
 * Provides standard JSON response methods for API endpoints.
 * All API controllers should extend this class.
 */
abstract class ApiController
{
    /**
     * Return a successful JSON response.
     *
     * @param  JsonResource|Model|array<string, mixed>  $data
     * @param  array<string, mixed>  $meta
     */
    protected function success(
        JsonResource|Model|array $data = [],
        string $message = 'Success',
        int $status = 200,
        array $meta = [],
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if (! empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Return an error JSON response.
     *
     * @param  array<string, mixed>|string  $errors
     * @param  array<string, mixed>  $meta
     */
    protected function error(
        array|string $errors = 'An error occurred',
        string $message = 'Error',
        int $status = 400,
        array $meta = [],
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (is_array($errors)) {
            $response['errors'] = $errors;
        } else {
            $response['error'] = $errors;
        }

        if (! empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Return a paginated JSON response.
     *
     * @param  array<string, mixed>  $meta
     */
    protected function paginated(
        ResourceCollection|LengthAwarePaginator $paginator,
        string $message = 'Success',
        int $status = 200,
        array $meta = [],
    ): JsonResponse {
        $data = $paginator instanceof ResourceCollection
            ? $paginator->response()->getData(true)
            : ['data' => $paginator->items()];

        $pagination = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];

        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data['data'] ?? $data,
            'pagination' => $pagination,
        ];

        if (! empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Return a validation error response.
     *
     * @param  array<string, mixed>  $errors
     */
    protected function validationError(
        array $errors,
        string $message = 'Validation failed',
    ): JsonResponse {
        return $this->error($errors, $message, 422);
    }

    /**
     * Return a not found response.
     */
    protected function notFound(
        string $message = 'Resource not found',
    ): JsonResponse {
        return $this->error($message, $message, 404);
    }

    /**
     * Return an unauthorized response.
     */
    protected function unauthorized(
        string $message = 'Unauthorized',
    ): JsonResponse {
        return $this->error($message, $message, 401);
    }

    /**
     * Return a forbidden response.
     */
    protected function forbidden(
        string $message = 'Forbidden',
    ): JsonResponse {
        return $this->error($message, $message, 403);
    }

    /**
     * Return a created response.
     *
     * @param  JsonResource|Model|array<string, mixed>  $data
     */
    protected function created(
        JsonResource|Model|array $data,
        string $message = 'Resource created successfully',
    ): JsonResponse {
        return $this->success($data, $message, 201);
    }

    /**
     * Return a no content response.
     */
    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }
}
