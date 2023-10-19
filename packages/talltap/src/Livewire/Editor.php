<?php

namespace Talltap\Talltap\Livewire;

use Livewire\Attributes\Modelable;
use Livewire\Component;
use Talltap\Support\Facades\TalltapExtension;

class Editor extends Component
{
    #[Modelable]
    public ?string $value = '';

    public ?array $configuration = [];

    public ?array $bubbleMenuActiveTrigger = [];

    protected ?array $toolbarComponents = null;

    protected ?array $bubbleMenuComponents = null;

    public string $alpineStoreName;

    public function getConfiguration(string $id): ?array
    {
        return $this->configuration[$id] ?? null;
    }

    public function mount(): void
    {
        $this->alpineStoreName = 'bla'; // Ulid::generate();
    }

    public function boot(): void
    {
        $this->toolbarComponents = TalltapExtension::getToolbarComponents();
        $this->bubbleMenuComponents = TalltapExtension::getBubbleMenuComponents();
        $this->bubbleMenuActiveTrigger = collect($this->bubbleMenuComponents)->map(fn ($comp) => $comp->isActive())->filter()->toArray();
    }

    public function render(): \Illuminate\Contracts\View\View | \Illuminate\Foundation\Application | \Illuminate\Contracts\View\Factory | \Illuminate\Contracts\Foundation\Application
    {
        return view('talltap::livewire.editor');
    }
}
