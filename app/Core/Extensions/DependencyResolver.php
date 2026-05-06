<?php

namespace App\Core\Extensions;

use App\Models\Extension;

final class DependencyResolver
{
    /**
     * Resolve the boot order for the given identifiers using Kahn's algorithm.
     *
     * @param  list<string>  $identifiers
     * @return list<string> Sorted identifiers (dependencies first)
     *
     * @throws CircularDependencyException
     */
    public function resolveOrder(array $identifiers): array
    {
        $graph = $this->buildGraph($identifiers);
        $inDegree = [];
        $result = [];

        foreach ($identifiers as $id) {
            $inDegree[$id] = 0;
        }

        foreach ($graph as $id => $deps) {
            foreach ($deps as $dep) {
                if (isset($inDegree[$dep])) {
                    $inDegree[$dep]++;
                }
            }
        }

        $queue = [];
        foreach ($inDegree as $id => $degree) {
            if ($degree === 0) {
                $queue[] = $id;
            }
        }

        while ($queue !== []) {
            $current = array_shift($queue);
            $result[] = $current;

            foreach ($graph[$current] ?? [] as $dep) {
                if (! isset($inDegree[$dep])) {
                    continue;
                }
                $inDegree[$dep]--;
                if ($inDegree[$dep] === 0) {
                    $queue[] = $dep;
                }
            }
        }

        if (count($result) !== count($identifiers)) {
            $remaining = array_diff($identifiers, $result);
            throw new CircularDependencyException(array_values($remaining));
        }

        return $result;
    }

    /**
     * Return identifiers of missing dependencies for a given extension.
     *
     * @return list<string>
     */
    public function missingDependencies(string $identifier): array
    {
        $manifest = app(ExtensionManager::class)->manifest($identifier);

        if ($manifest === null || $manifest->dependencies === []) {
            return [];
        }

        $installed = Extension::query()
            ->whereIn('identifier', $manifest->dependencies)
            ->whereNotNull('state')
            ->pluck('identifier')
            ->all();

        return array_values(array_diff($manifest->dependencies, $installed));
    }

    /**
     * Check if all required dependencies are enabled for a team.
     */
    public function canEnable(string $identifier, int $teamId): bool
    {
        return $this->missingDependencies($identifier) === [];
    }

    /**
     * Check if any enabled extension depends on the given one.
     */
    public function canDisable(string $identifier, int $teamId): bool
    {
        return $this->dependents($identifier) === [];
    }

    /**
     * Get all extensions that depend on the given identifier.
     *
     * @return list<string>
     */
    public function dependents(string $identifier): array
    {
        $all = Extension::whereNotNull('state')->get();
        $dependents = [];

        foreach ($all as $ext) {
            $deps = $ext->dependencies ?? [];
            if (in_array($identifier, $deps, true)) {
                $dependents[] = $ext->identifier;
            }
        }

        return $dependents;
    }

    /**
     * Build a dependency graph: node => [nodes it depends on].
     *
     * @param  list<string>  $identifiers
     * @return array<string, list<string>>
     */
    private function buildGraph(array $identifiers): array
    {
        $manager = app(ExtensionManager::class);
        $graph = [];

        foreach ($identifiers as $id) {
            $manifest = $manager->manifest($id);
            $graph[$id] = $manifest?->dependencies ?? [];
        }

        return $graph;
    }
}
