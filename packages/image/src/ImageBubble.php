<?php

namespace Talltap\Image;

use Illuminate\View\Component;
use Talltap\Support\Contracts\BubbleMenu;

class ImageBubble extends Component implements BubbleMenu
{
    public array $config = [];

    public static function isActive(): array | string
    {
        return 'image';
    }

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? config('talltap.config.extensions.image', []);
    }

    public function render(): \Illuminate\Contracts\View\View | \Illuminate\Contracts\View\Factory | \Illuminate\Foundation\Application | \Illuminate\Contracts\Support\Htmlable | string | \Closure | \Illuminate\Contracts\Foundation\Application
    {
        return view('image::bubble');
    }
}
