<?php

namespace Modules\Tasks\Enums;

enum TaskPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';

    public function order(): int
    {
        return match ($this) {
            self::High => 1,
            self::Medium => 2,
            self::Low => 3,
        };
    }
}
