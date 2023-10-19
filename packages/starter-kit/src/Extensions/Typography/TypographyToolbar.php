<?php

namespace Talltap\StarterKit\Extensions\Typography;

use Illuminate\View\Component;

class TypographyToolbar extends Component
{
    public array $config = [
        'toggles' => ['bold', 'italic', 'underline', 'strike'],
    ];

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? config('talltap.config.extensions.typography', []);
    }

    public function render(): string
    {
        return <<<'BLADE'
        <span class="isolate inline-flex rounded-md shadow-sm" >
          @foreach($config["toggles"] as $typo)
              <button type="button"
                @class([
                    'relative -ml-px inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10',
                    'rounded-r-md' => $loop->last,
                    'rounded-l-md' => $loop->first,
                ])
                :class="isActive('{{$typo}}', updatedAt) ? 'text-white bg-slate-500 hover:bg-slate-500' : 'text-gray-400 bg-white'"
                @click='editor().chain().focus().toggle{{Str::ucfirst($typo)}}().run()'
                >
                <span class="sr-only">Text stye {{$typo}}</span>
                @if($typo === 'strike')
                    @svg('ri-strikethrough', ['class' => 'w-4 h-4'])
                @else
                    @svg('ri-'. $typo, ['class' => 'w-4 h-4'])
                @endif
              </button>
          @endforeach
        </span>
BLADE;
    }
}
