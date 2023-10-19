<div wire:ignore>
    <div x-data="talltap($wire.value, $wire.bubbleMenuActiveTrigger)">
        <div class="mb-4">
            @foreach($this->toolbarComponents as $comp)
                @if($comp->isLivewire())
                    <livewire:dynamic-component :is="$comp->getComponentSlug()" :configuration="$this->getConfiguration($comp->getId())" />
                @else
                    <x-dynamic-component :component="$comp->getComponentSlug()" :configuration="$this->getConfiguration($comp->getId())" />
                @endif
            @endforeach
        </div>
        <div x-cloak id="bubbleMenu" class="bg-black p-2 rounded-md shadow-sm flex flex-row" data-editor="tallEditor">
            @foreach($this->bubbleMenuComponents as $comp)
                @if($comp->isLivewire())
                    <livewire:dynamic-component :is="$comp->getComponentSlug()" :configuration="$this->getConfiguration($comp->getId())" />
                @else
                    <x-dynamic-component :component="$comp->getComponentSlug()" :configuration="$this->getConfiguration($comp->getId())" />
                @endif
            @endforeach
        </div>

        <div x-ref="tiptap" class="h-full"></div>
        <div class="border-t border-gray-200 pt-2 mt-2">
        <span>
            <span x-text="data.characterCount">
            </span>
            Characters
        </span>
        </div>
    </div>
</div>