<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Carbon;
use Modules\EmailBuilder\Services\TemplateManager;

abstract class BaseMailable extends Mailable
{
    protected string $recipientLocale;

    protected ?int $teamId = null;

    public function __construct(?User $recipient = null)
    {
        $this->recipientLocale = $recipient?->locale ?? config('app.locale', 'fr');
        $this->locale($this->recipientLocale);
        $this->teamId = $recipient?->currentTeam?->id;
    }

    public function recipientLocale(): string
    {
        return $this->recipientLocale;
    }

    public function formatDate(Carbon|string|null $date, string $format = 'long'): string
    {
        if (! $date) {
            return '';
        }

        $carbon = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $carbon->locale($this->recipientLocale)->translatedFormat(
            $format === 'long' ? 'd F Y' : 'd/m/Y',
        );
    }

    protected function buildFromTemplate(string $module, string $identifier, array $variables): ?self
    {
        if (! $this->teamId || ! class_exists(TemplateManager::class)) {
            return null;
        }

        $rendered = app(TemplateManager::class)->render(
            $this->teamId,
            $module,
            $identifier,
            $this->recipientLocale,
            $variables,
        );

        if ($rendered) {
            return $this->subject($rendered['subject'])
                ->html($rendered['html_content']);
        }

        return null;
    }
}
