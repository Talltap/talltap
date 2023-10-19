<?php

namespace Talltap\StarterKit\Extensions\Alignment;

use Illuminate\View\Component;

class AlignmentToolbar extends Component
{
    public array $config = [
        'alignments' => ['left', 'center', 'right', 'justify'],
    ];

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? config('talltap.config.extensions.heading', []);
    }

    public function render(): string
    {
        return <<<'blade'
        <span class="isolate inline-flex rounded-md shadow-sm">
          @foreach($config['alignments'] as $alignment)
              <button type="button"
                @class([
                    'relative -ml-px inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10',
                    'rounded-r-md' => $loop->last,
                    'rounded-l-md' => $loop->first,
                ])
                :class="isActive({ textAlign: '{{$alignment}}' }, updatedAt) ? 'text-white bg-slate-500 hover:bg-slate-500' : 'text-gray-400 bg-white'"
                @click="editor().chain().focus().setTextAlign('{{$alignment}}').run()"
                >
                <span class="sr-only">Text Alignment {{$alignment}}</span>
                @svg('ri-align-'. $alignment, ['class' => 'w-4 h-4'])
              </button>
          @endforeach
        </span>
blade;
    }
}
