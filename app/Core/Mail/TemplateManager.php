<?php

namespace App\Core\Mail;

use App\Models\EmailTemplate;
use Illuminate\Support\Collection;

class TemplateManager
{
    /** @var array<string, array{variables: array<string, string>, defaults: array<string, array{subject: string, html_content: string}>}> */
    private array $registry = [];

    /**
     * Register default templates for a module identifier.
     * Called by module ServiceProviders during boot.
     */
    public function registerDefault(
        string $module,
        string $identifier,
        array $localeContents,
        array $variables = [],
    ): void {
        $key = "{$module}.{$identifier}";

        $this->registry[$key] = [
            'module' => $module,
            'identifier' => $identifier,
            'variables' => $variables,
            'locales' => $localeContents,
        ];
    }

    /**
     * Seed default templates for a team (only if they don't exist yet).
     */
    public function seedForTeam(int $teamId): void
    {
        foreach ($this->registry as $key => $config) {
            foreach ($config['locales'] as $locale => $content) {
                $exists = EmailTemplate::forTeam($teamId)
                    ->byModule($config['module'])
                    ->byIdentifier($config['identifier'])
                    ->byLocale($locale)
                    ->exists();

                if (! $exists) {
                    EmailTemplate::create([
                        'team_id' => $teamId,
                        'module' => $config['module'],
                        'identifier' => $config['identifier'],
                        'locale' => $locale,
                        'subject' => $content['subject'],
                        'html_content' => $content['html_content'],
                        'is_default' => true,
                    ]);
                }
            }
        }
    }

    /**
     * Render a template with variable replacement.
     * Returns null if no template found (caller should fallback to Blade).
     */
    public function render(int $teamId, string $identifier, string $locale, array $variables): ?RenderedTemplate
    {
        // Try exact locale first, then fallback locale
        $template = $this->findTemplate($teamId, $identifier, $locale);

        if (! $template) {
            $fallback = config('app.fallback_locale', 'fr');
            $template = $this->findTemplate($teamId, $identifier, $fallback);
        }

        if (! $template) {
            return null;
        }

        $subject = $this->replaceVariables($template->subject, $variables);
        $html = $this->replaceVariables($template->html_content, $variables);

        return new RenderedTemplate($subject, $html);
    }

    /**
     * Replace {{variable}} placeholders in content.
     */
    public function replaceVariables(string $content, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $content = str_replace(["{{{$key}}}", "{{ {$key} }}"], (string) $value, $content);
        }

        return $content;
    }

    /**
     * List all templates for a team, grouped by module.identifier.
     */
    public function listForTeam(int $teamId): Collection
    {
        return EmailTemplate::forTeam($teamId)
            ->orderBy('module')
            ->orderBy('identifier')
            ->orderBy('locale')
            ->get();
    }

    /**
     * Get the available variables for a given identifier.
     */
    public function getVariablesFor(string $module, string $identifier): array
    {
        $key = "{$module}.{$identifier}";

        return $this->registry[$key]['variables'] ?? [];
    }

    /**
     * Get all registered template identifiers grouped by module.
     */
    public function getRegisteredTemplates(): array
    {
        return collect($this->registry)
            ->groupBy('module')
            ->map(fn ($items) => $items->map(fn ($item) => [
                'identifier' => $item['identifier'],
                'variables' => $item['variables'],
                'locales' => array_keys($item['locales']),
            ])->values()->all())
            ->all();
    }

    /**
     * Reset a template to its default content.
     */
    public function resetToDefault(int $teamId, string $module, string $identifier, string $locale): bool
    {
        $key = "{$module}.{$identifier}";
        $config = $this->registry[$key] ?? null;

        if (! $config || ! isset($config['locales'][$locale])) {
            return false;
        }

        $content = $config['locales'][$locale];

        EmailTemplate::forTeam($teamId)
            ->byModule($module)
            ->byIdentifier($identifier)
            ->byLocale($locale)
            ->update([
                'subject' => $content['subject'],
                'html_content' => $content['html_content'],
                'editor_state' => null,
                'is_default' => true,
            ]);

        return true;
    }

    private function findTemplate(int $teamId, string $identifier, string $locale): ?EmailTemplate
    {
        // Parse module.identifier format
        $parts = explode('.', $identifier, 2);
        if (count($parts) !== 2) {
            return null;
        }

        [$module, $ident] = $parts;

        return EmailTemplate::forTeam($teamId)
            ->byModule($module)
            ->byIdentifier($ident)
            ->byLocale($locale)
            ->first();
    }
}
