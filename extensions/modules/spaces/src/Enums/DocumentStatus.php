<?php

namespace Modules\Spaces\Enums;

enum DocumentStatus: string
{
    case Active = 'active';
    case PendingSignature = 'pending_signature';
    case Signed = 'signed';
}
