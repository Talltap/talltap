<?php

namespace Talltap\Talltap\Livewire;

use Illuminate\Support\Str;
use Livewire\Attributes\Modelable;
use Livewire\Component;
use Livewire\WithFileUploads;
use Talltap\Support\Facades\TalltapExtension;

class Editor extends Component
{
    use WithFileUploads;

    #[Modelable]
    public ?string $value = '';

    public $files = [];

    public ?array $configuration = [];

    public ?array $bubbleMenuActiveTrigger = [];

    protected ?array $toolbarComponents = null;

    protected ?array $bubbleMenuComponents = null;

    public function getConfiguration(?string $id = null): ?array
    {
        if ($id == null) {
            return $this->configuration;
        }

        return $this->configuration[$id] ?? null;
    }

    public function mount(): void
    {
        $this->setId('talltap_' . Str::ulid());
    }

    public function getTemporaryUrl($filename): string
    {
        $image = collect($this->files)->first(fn ($file) => $file->getFilename() === $filename);

        return $image->temporaryUrl();
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
