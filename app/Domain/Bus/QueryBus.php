<?php

namespace App\Domain\Bus;

use App\Domain\Queries\Query;
use App\Domain\Queries\QueryHandler;
use Illuminate\Container\Container;

/**
 * Query Bus
 *
 * Executes queries by dispatching them to their registered handlers.
 * Provides synchronous query execution with automatic handler resolution.
 */
class QueryBus
{
    protected Container $container;

    /** @var array<class-string, class-string> */
    protected array $handlers = [];

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Register a handler for a query.
     *
     * @param  class-string  $query
     * @param  class-string  $handler
     */
    public function register(string $query, string $handler): self
    {
        $this->handlers[$query] = $handler;

        return $this;
    }

    /**
     * Register multiple handlers at once.
     *
     * @param  array<class-string, class-string>  $handlers
     */
    public function registerHandlers(array $handlers): self
    {
        foreach ($handlers as $query => $handler) {
            $this->register($query, $handler);
        }

        return $this;
    }

    /**
     * Execute a query.
     */
    public function ask(Query $query): mixed
    {
        $handlerClass = $this->handlers[get_class($query)] ?? null;

        if ($handlerClass === null) {
            throw new \InvalidArgumentException('No handler registered for query: '.get_class($query));
        }

        $handler = $this->container->make($handlerClass);

        if (! $handler instanceof QueryHandler) {
            throw new \InvalidArgumentException("Handler must implement QueryHandler: {$handlerClass}");
        }

        return $handler->handle($query);
    }

    /**
     * Execute a query with caching.
     */
    public function askWithCache(Query $query, int|\DateTimeInterface|\DateInterval|null $ttl = null): mixed
    {
        $cacheKey = 'query:'.md5(serialize($query));

        return app('cache')->remember($cacheKey, $ttl, fn () => $this->ask($query));
    }

    /**
     * Get all registered handlers.
     *
     * @return array<class-string, class-string>
     */
    public function getHandlers(): array
    {
        return $this->handlers;
    }
}
