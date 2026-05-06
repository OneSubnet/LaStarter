<?php

namespace App\Core\Extensions;

final class CircularDependencyException extends \RuntimeException
{
    /**
     * @param  list<string>  $cycle  The identifiers involved in the cycle
     */
    public function __construct(public readonly array $cycle)
    {
        parent::__construct('Circular dependency detected: '.implode(' -> ', $cycle));
    }
}
