<?php

namespace App\Core\Modules;

final class ModuleApiRegistry
{
    /** @var array<string, object> */
    private array $bindings = [];

    /** @var array<string, string> */
    private array $sources = [];

    /**
     * Register an implementation for a contract.
     */
    public function register(string $contract, string $module, object $implementation): void
    {
        $this->bindings[$contract] = $implementation;
        $this->sources[$contract] = $module;
    }

    /**
     * Resolve a contract. Returns null if no module provides it.
     */
    public function get(string $contract): ?object
    {
        return $this->bindings[$contract] ?? null;
    }

    /**
     * Check if a contract is available.
     */
    public function has(string $contract): bool
    {
        return isset($this->bindings[$contract]);
    }

    /**
     * Resolve or throw.
     */
    public function getOrFail(string $contract): object
    {
        $impl = $this->get($contract);

        if ($impl === null) {
            throw new \RuntimeException("No module provides '{$contract}'");
        }

        return $impl;
    }

    /**
     * Get all APIs provided by a specific module.
     *
     * @return array<string, object>
     */
    public function forModule(string $module): array
    {
        $result = [];

        foreach ($this->sources as $contract => $source) {
            if ($source === $module) {
                $result[$contract] = $this->bindings[$contract];
            }
        }

        return $result;
    }

    /**
     * Get all registered contracts.
     *
     * @return list<string>
     */
    public function registered(): array
    {
        return array_keys($this->bindings);
    }
}
