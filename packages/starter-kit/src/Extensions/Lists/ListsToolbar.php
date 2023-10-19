<?php

namespace Talltap\StarterKit\Extensions\Lists;

use Illuminate\View\Component;

class ListsToolbar extends Component
{
    public array $config = [
        'styles' => ['ordered', 'bullet'],
    ];

    public function __construct(array $config = [])
    {
        $this->config = config('talltap.config.extensions.list', $this->config);
    }

    public function render(): string
    {
        return <<<'BLADE'
        <span class="isolate inline-flex rounded-md shadow-sm">
          @foreach($config["styles"] as $style)
              <button type="button"
                @class([
                    'relative -ml-px inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10',
                    'rounded-r-md' => $loop->last,
                    'rounded-l-md' => $loop->first,
                ])
                :class="isActive('{{$style}}List', updatedAt) ? 'text-white bg-slate-500 hover:bg-slate-500' : 'text-gray-400 bg-white'"
                @click='editor().chain().focus().toggle{{Str::ucfirst($style)}}List().run()'
                >
                <span class="sr-only">Text stye {{$style}}</span>
                @if($style === 'bullet')
                    @svg('ri-list-unordered', ['class' => 'w-4 h-4'])
                @else
                    @svg('ri-list-'. $style, ['class' => 'w-4 h-4'])
                @endif
              </button>
          @endforeach
        </span>
BLADE;
    }
}
