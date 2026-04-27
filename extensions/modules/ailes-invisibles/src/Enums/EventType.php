<?php

namespace Modules\AilesInvisibles\Enums;

enum EventType: string
{
    case Service = 'service';
    case Event = 'event';
    case Consultation = 'consultation';
    case Formation = 'formation';
}
