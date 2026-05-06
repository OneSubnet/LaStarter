<?php

namespace App\Core\System\Events;

final readonly class CoreUpdateFailed
{
    /**
     * @param  list<string>  $errors
     */
    public function __construct(
        public string $fromVersion,
        public ?string $targetVersion,
        public array $errors,
    ) {}
}
