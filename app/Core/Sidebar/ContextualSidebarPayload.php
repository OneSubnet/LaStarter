<?php

namespace App\Core\Sidebar;

final class ContextualSidebarPayload
{
    private ?string $headerTitle = null;

    private ?string $headerSubtitle = null;

    private ?string $headerHref = null;

    private ?int $headerProgress = null;

    /** @var array<int, array{title: string, items: array<int, array{title: string, href: string, icon: string, meta?: string, active: bool}>}> */
    private array $sections = [];

    public function setHeader(string $title, ?string $subtitle = null, ?string $href = null, ?int $progress = null): self
    {
        $this->headerTitle = $title;
        $this->headerSubtitle = $subtitle;
        $this->headerHref = $href;
        $this->headerProgress = $progress;

        return $this;
    }

    /**
     * @param  array<int, array{title: string, href: string, icon: string, meta?: string, active: bool}>  $items
     */
    public function addSection(string $title, array $items): self
    {
        $this->sections[] = ['title' => $title, 'items' => $items];

        return $this;
    }

    public function isEmpty(): bool
    {
        return $this->headerTitle === null && empty($this->sections);
    }

    public function toArray(): array
    {
        return [
            'header' => $this->headerTitle ? [
                'title' => $this->headerTitle,
                'subtitle' => $this->headerSubtitle,
                'href' => $this->headerHref,
                'progress' => $this->headerProgress,
            ] : null,
            'sections' => $this->sections,
        ];
    }
}
