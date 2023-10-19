<?php

namespace Talltap\Youtube;

use Illuminate\View\Component;

class YoutubeToolbar extends Component
{
    public array $config = [];

    public function __construct(array $config = [])
    {
        $this->config = config('talltap.config.extensions.youtube', $this->config);
    }

    public function render(): \Illuminate\Contracts\View\View | \Illuminate\Contracts\View\Factory | \Illuminate\Foundation\Application | \Illuminate\Contracts\Support\Htmlable | string | \Closure | \Illuminate\Contracts\Foundation\Application
    {
        return view('youtube::toolbar');
    }
}
