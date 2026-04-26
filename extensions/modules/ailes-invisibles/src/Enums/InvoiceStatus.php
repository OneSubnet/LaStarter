<?php

namespace Modules\AilesInvisibles\Enums;

enum InvoiceStatus: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case Viewed = 'viewed';
    case Paid = 'paid';
    case Partial = 'partial';
    case Overdue = 'overdue';
    case Cancelled = 'cancelled';
}
