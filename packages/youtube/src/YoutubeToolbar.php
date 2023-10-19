<?php

namespace Talltap\Youtube;

use Illuminate\View\Component;

class YoutubeToolbar extends Component
{
    /**
     * @param array<mixed> $config
     */
    public array $config = [];

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? config('talltap.config.extensions.youtube', []);
    }

    public function render(): \Illuminate\Contracts\View\View | \Illuminate\Contracts\View\Factory | \Illuminate\Foundation\Application | \Illuminate\Contracts\Support\Htmlable | string | \Closure | \Illuminate\Contracts\Foundation\Application
    {
        return view('youtube::toolbar');
    }
}
