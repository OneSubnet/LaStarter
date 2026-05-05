<?php

namespace App\Domain\Bus;

use App\Domain\Commands\Command;
use App\Domain\Commands\CommandHandler;
use Illuminate\Container\Container;

/**
 * Command Bus
 *
 * Executes commands by dispatching them to their registered handlers.
 * Provides synchronous command execution with automatic handler resolution.
 */
class CommandBus
{
    protected Container $container;

    /** @var array<class-string, class-string> */
    protected array $handlers = [];

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Register a handler for a command.
     *
     * @param  class-string  $command
     * @param  class-string  $handler
     */
    public function register(string $command, string $handler): self
    {
        $this->handlers[$command] = $handler;

        return $this;
    }

    /**
     * Register multiple handlers at once.
     *
     * @param  array<class-string, class-string>  $handlers
     */
    public function registerHandlers(array $handlers): self
    {
        foreach ($handlers as $command => $handler) {
            $this->register($command, $handler);
        }

        return $this;
    }

    /**
     * Execute a command.
     */
    public function dispatch(Command $command): mixed
    {
        $handlerClass = $this->handlers[get_class($command)] ?? null;

        if ($handlerClass === null) {
            throw new \InvalidArgumentException('No handler registered for command: '.get_class($command));
        }

        $handler = $this->container->make($handlerClass);

        if (! $handler instanceof CommandHandler) {
            throw new \InvalidArgumentException("Handler must implement CommandHandler: {$handlerClass}");
        }

        return $handler->handle($command);
    }

    /**
     * Execute a command if a condition is met.
     */
    public function dispatchIf(bool $condition, Command $command): mixed
    {
        if ($condition) {
            return $this->dispatch($command);
        }

        return null;
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
