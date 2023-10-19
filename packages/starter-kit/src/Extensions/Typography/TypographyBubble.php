<?php

namespace Talltap\StarterKit\Extensions\Typography;

use Illuminate\View\Component;
use Talltap\Support\Contracts\BubbleMenu;

class TypographyBubble extends Component implements BubbleMenu
{
    public array $config = [
        'toggles' => ['bold', 'italic', 'underline', 'strike'],
    ];

    public static function isActive(): array | string
    {
        return '*';
    }

    public function __construct(array $config = [])
    {
        $this->config = config('talltap.config.extensions.typography', $this->config);
    }

    public function render(): string
    {
        return <<<'BLADE'
        <span x-data="typoBubble()" x-bind="bubbleMenuRef">
               <x-talltap::bubble-menu>
            @foreach($config["toggles"] as $typo)
                  <x-talltap::bubble-menu.item :activeTrigger="$typo"
                    @click='editor().chain().focus().toggle{{Str::ucfirst($typo)}}().run()'
                    >
                    <span class="sr-only">Text stye {{$typo}}</span>
                    @if($typo === 'strike')
                        @svg('ri-strikethrough', ['class' => 'w-4 h-4'])
                    @else
                        @svg('ri-'. $typo, ['class' => 'w-4 h-4'])
                    @endif
                  </x-talltap::bubble-menu.item>
              @endforeach
        </x-talltap::bubble-menu> 
</span>
        <script>
        function typoBubble() {
            return {
                ...bubbleMenuRef('*'),
                evaluateIfShowing(){
                    let editor = this.getEditor();
                    this.show = !editor.view.state.selection.empty && !editor.isActive('youtube') && !editor.isActive('image') ;
                },
                
            }
        }
        </script>
BLADE;
    }
}
