<?php

namespace Modules\AilesInvisibles\Enums;

enum PaymentMethod: string
{
    case Card = 'card';
    case Transfer = 'transfer';
    case Check = 'check';
    case Cash = 'cash';
    case Other = 'other';
}
