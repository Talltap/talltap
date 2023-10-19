<?php

namespace Talltap\StarterKit\Extensions\Heading;

use Illuminate\View\Component;

class HeadingToolbar extends Component
{
    public array $config = [
        'levels' => [1, 2, 3],
    ];

    /**
     * @param  array  $config
     */
    public function __construct(?array $configuration = null)
    {
        if ($configuration) {
            $this->config = $configuration;
        } else {
            $this->config = config('talltap.config.extensions.heading', $this->config);
        }
    }

    public function render(): string
    {
        return <<<'BLADE'
        <span class="isolate inline-flex rounded-md shadow-sm">
          @foreach($config["levels"] as $level)
                  <button type="button"
                    @class([
                        'relative -ml-px inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10',
                        'rounded-r-md' => $loop->last,
                        'rounded-l-md' => $loop->first,
                    ])
                    :class="isActive('heading', { level: {{$level}} }, updatedAt) ? 'text-white bg-slate-500 hover:bg-slate-500' : 'text-gray-400 bg-white'"
                    @click="editor().chain().focus().toggleHeading({level: {{$level}}}).run()"
                    >
                    <span class="sr-only">Heading H{{$level}}</span>
                    @svg('ri-h-'. $level, ['class' => 'w-4 h-4'])
                  </button>
              @endforeach
        </span>
BLADE;
    }
}
