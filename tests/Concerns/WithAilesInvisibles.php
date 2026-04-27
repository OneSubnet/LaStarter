<?php

namespace Tests\Concerns;

use Spatie\Permission\Models\Permission;

trait WithAilesInvisibles
{
    protected function seedAIPermissions(): void
    {
        $permissions = [
            'ai.client.view', 'ai.client.create', 'ai.client.update', 'ai.client.delete', 'ai.client.invite',
            'ai.product.view', 'ai.product.create', 'ai.product.update', 'ai.product.delete',
            'ai.event.view', 'ai.event.create', 'ai.event.update', 'ai.event.delete',
            'ai.quote.view', 'ai.quote.create', 'ai.quote.update', 'ai.quote.delete',
            'ai.quote.send', 'ai.quote.accept', 'ai.quote.convert',
            'ai.invoice.view', 'ai.invoice.create', 'ai.invoice.update', 'ai.invoice.delete',
            'ai.invoice.send', 'ai.invoice.record-payment', 'ai.invoice.cancel',
            'ai.accounting.view', 'ai.accounting.reports',
            'ai.document.view', 'ai.document.upload', 'ai.document.delete', 'ai.document.assign', 'ai.document.download',
            'ai.conversation.view', 'ai.conversation.create', 'ai.conversation.send',
            'ai.messaging.view', 'ai.messaging.send',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }
    }

    protected function loadAIModuleRoutes(): void
    {
        $routesPath = base_path('extensions/modules/ailes-invisibles/routes/web.php');
        if (file_exists($routesPath)) {
            require $routesPath;
        }
    }

    protected function setupAIModule(): void
    {
        $this->artisan('migrate', [
            '--path' => 'extensions/modules/ailes-invisibles/database/migrations',
            '--realpath' => true,
        ]);

        $this->seedAIPermissions();
    }
}
