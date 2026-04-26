<?php

namespace Modules\AilesInvisibles\Enums;

enum ProductUnit: string
{
    case Unit = 'unit';
    case Hour = 'hour';
    case Day = 'day';
    case Month = 'month';
    case SquareMeter = 'm2';
    case Kilogram = 'kg';
    case Session = 'session';
}
