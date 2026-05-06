<?php

namespace App\Core\System;

final readonly class CompatibilityReport
{
    /**
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     */
    public function __construct(
        public bool $compatible,
        public array $errors,
        public array $warnings,
    ) {}

    public static function ok(): self
    {
        return new self(true, [], []);
    }

    public static function error(string $msg): self
    {
        return new self(false, [$msg], []);
    }

    public static function warn(string $msg): self
    {
        return new self(true, [], [$msg]);
    }

    public function withError(string $msg): self
    {
        return new self(false, [...$this->errors, $msg], $this->warnings);
    }

    public function withWarning(string $msg): self
    {
        return new self($this->compatible, $this->errors, [...$this->warnings, $msg]);
    }

    public function merge(self $other): self
    {
        return new self(
            $this->compatible && $other->compatible,
            [...$this->errors, ...$other->errors],
            [...$this->warnings, ...$other->warnings],
        );
    }
}
