<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Invoice;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.invoice.view');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('ai.invoice.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ai.invoice.create');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('ai.invoice.update');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('ai.invoice.delete');
    }

    public function send(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('ai.invoice.send');
    }

    public function recordPayment(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('ai.invoice.record-payment');
    }

    public function cancel(User $user, Invoice $invoice): bool
    {
        return $user->hasPermissionTo('ai.invoice.cancel');
    }
}
