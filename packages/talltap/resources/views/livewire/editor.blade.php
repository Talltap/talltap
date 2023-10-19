<div wire:ignore>
    <div
        x-data="talltap(
                    $wire.value,
                    $wire.bubbleMenuActiveTrigger,
                    '{{ $this->getId() }}',
                    {{ Illuminate\Support\Js::from($this->getConfiguration()) }},
                )"
    >
        <div class="mb-4">
            @foreach ($this->toolbarComponents as $comp)
                @if ($comp->isLivewire())
                    <livewire:dynamic-component
                        :is="$comp->getComponentSlug()"
                        :configuration="$this->getConfiguration($comp->getId())"
                    />
                @else
                    <x-dynamic-component
                        :component="$comp->getComponentSlug()"
                        :configuration="$this->getConfiguration($comp->getId())"
                    />
                @endif
            @endforeach
        </div>
        <div
            x-cloak
            id="bubbleMenu"
            class="flex flex-row rounded-md bg-black p-2 shadow-sm"
            data-editor="{{ $this->getId() }}"
        >
            @foreach ($this->bubbleMenuComponents as $comp)
                @if ($comp->isLivewire())
                    <livewire:dynamic-component
                        :is="$comp->getComponentSlug()"
                        :configuration="$this->getConfiguration($comp->getId())"
                    />
                @else
                    <x-dynamic-component
                        :component="$comp->getComponentSlug()"
                        :configuration="$this->getConfiguration($comp->getId())"
                    />
                @endif
            @endforeach
        </div>

        <div x-ref="tiptap" class="h-full"></div>
        <div class="mt-2 border-t border-gray-200 pt-2">
            <span>
                <span x-text="data.characterCount"></span>
                Characters
            </span>
        </div>
    </div>
</div>
