<?php

namespace App\Domains\Cms\Event;

use App\Core\Context\AppContext;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Base resource event with full audit context.
 */
abstract class ResourceEvent
{
    use Dispatchable;

    public readonly ?User $user;

    public readonly ?int $teamId;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public readonly ?Model $model,
        ?User $user = null,
        ?int $teamId = null,
        public readonly array $metadata = [],
    ) {
        $this->user = $user ?? app(AppContext::class)->user();
        $this->teamId = $teamId ?? app(AppContext::class)->team()?->id;
    }

    /**
     * Get the resource type (short class name).
     */
    public function getResourceType(): string
    {
        if ($this->model === null) {
            return $this->metadata['resource_type'] ?? 'Resource';
        }

        return class_basename($this->model);
    }

    /**
     * Get the action name (created, updated, deleted, etc.).
     */
    abstract public function getAction(): string;

    /**
     * Get the full description for audit.
     */
    public function getDescription(): string
    {
        if ($this->model === null) {
            return $this->metadata['description'] ?? sprintf(
                '%s %s',
                $this->getAction(),
                $this->getResourceType()
            );
        }

        return sprintf(
            '%s %s #%d',
            $this->getAction(),
            $this->getResourceType(),
            $this->model->getKey()
        );
    }
}
