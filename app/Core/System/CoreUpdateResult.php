<?php

namespace App\Core\System;

final readonly class CoreUpdateResult
{
    /**
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     */
    public function __construct(
        public bool $success,
        public ?string $fromVersion,
        public ?string $toVersion,
        public array $errors,
        public array $warnings,
        public ?string $backupPath,
    ) {}

    public static function success(string $from, string $to, string $backup): self
    {
        return new self(true, $from, $to, [], [], $backup);
    }

    public static function failed(array $errors, ?string $backup = null): self
    {
        return new self(false, null, null, $errors, [], $backup);
    }
}
