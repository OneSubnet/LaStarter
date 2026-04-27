<?php

namespace Modules\AilesInvisibles\Enums;

enum DocumentStatus: string
{
    case Uploaded = 'uploaded';
    case PendingSignature = 'pending_signature';
    case Signed = 'signed';
    case Expired = 'expired';
}
