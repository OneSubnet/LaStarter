<?php

namespace App\Http\Api;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;

/**
 * Response Builder
 *
 * Fluent API for building consistent JSON responses.
 *
 * @method self success(bool $success)
 * @method self message(string $message)
 * @method self data(array|Model|Collection $data)
 * @method self meta(array $meta)
 * @method self errors(array|string $errors)
 * @method self status(int $status)
 */
class ResponseBuilder
{
    protected bool $success = true;

    protected string $message = 'Success';

    protected array $data = [];

    protected array $meta = [];

    protected array|string|null $errors = null;

    protected array $pagination = [];

    protected int $status = 200;

    /**
     * Create a new response builder instance.
     */
    public static function make(): self
    {
        return new self;
    }

    /**
     * Set the success status.
     */
    public function success(bool $success): self
    {
        $this->success = $success;

        return $this;
    }

    /**
     * Set the response message.
     */
    public function message(string $message): self
    {
        $this->message = $message;

        return $this;
    }

    /**
     * Set the response data.
     *
     * @param  array<string, mixed>|Model|Collection  $data
     */
    public function data(array|Model|Collection $data): self
    {
        if ($data instanceof Model) {
            $this->data = $data->toArray();
        } elseif ($data instanceof Collection) {
            $this->data = $data->toArray();
        } else {
            $this->data = $data;
        }

        return $this;
    }

    /**
     * Set the response metadata.
     *
     * @param  array<string, mixed>  $meta
     */
    public function meta(array $meta): self
    {
        $this->meta = $meta;

        return $this;
    }

    /**
     * Set the error information.
     *
     * @param  array<string, mixed>|string  $errors
     */
    public function errors(array|string $errors): self
    {
        $this->errors = $errors;

        return $this;
    }

    /**
     * Set the HTTP status code.
     */
    public function status(int $status): self
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Set pagination information.
     */
    public function pagination(LengthAwarePaginator $paginator): self
    {
        $this->pagination = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];

        $this->data($paginator->items());

        return $this;
    }

    /**
     * Build and return the JSON response.
     */
    public function build(): JsonResponse
    {
        $response = [
            'success' => $this->success,
            'message' => $this->message,
        ];

        if (! empty($this->errors)) {
            $response['errors'] = $this->errors;
        } else {
            $response['data'] = $this->data;
        }

        if (! empty($this->meta)) {
            $response['meta'] = $this->meta;
        }

        if (! empty($this->pagination)) {
            $response['pagination'] = $this->pagination;
        }

        return response()->json($response, $this->status);
    }

    /**
     * Magic method for property setters.
     */
    public function __call(string $name, array $arguments): self
    {
        $property = match ($name) {
            'success' => 'success',
            'message' => 'message',
            'data' => 'data',
            'meta' => 'meta',
            'errors' => 'errors',
            'status' => 'status',
            default => null,
        };

        if ($property !== null && property_exists($this, $property)) {
            $this->{$property} = $arguments[0];

            return $this;
        }

        throw new \BadMethodCallException("Method {$name} does not exist.");
    }
}
