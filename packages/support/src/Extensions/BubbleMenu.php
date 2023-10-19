<?php

namespace Talltap\Support\Extensions;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Str;
use Livewire\Livewire;

class BubbleMenu extends Extension
{
    final public function __construct(
        protected string $id,
        protected ?string $class = null,
        protected ?bool $livewire = false,
        protected ?string $componentSlug = null
    ) {
    }

    public static function make(string $id, ?string $class = null, ?bool $livewire = false): static
    {
        return app(static::class, ['id' => $id, 'class' => $class, 'livewire' => $livewire]);
    }

    public function boot(): void
    {
        $this->componentSlug = Str::replace('/', '-', Str::snake(($this->package), '-')) . '-' . $this->id . '-bubble-menu';

        if ($this->livewire) {
            Livewire::component($this->componentSlug, $this->class);

            return;
        }
        Blade::component($this->componentSlug, $this->class);
    }

    public function isLivewire(): bool
    {
        return $this->livewire;
    }

    public function getComponentSlug(): string
    {
        return $this->componentSlug;
    }

    public function isActive(): array | string
    {
        return ($this->class)::isActive();
    }
}
