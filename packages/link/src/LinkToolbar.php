<?php

namespace Talltap\Link;

use Illuminate\View\Component;

class LinkToolbar extends Component
{
    public array $config = [];

    public function __construct(array $config = [])
    {
        $this->config = config('talltap.config.extensions.link', $this->config);
    }

    public function render(): \Illuminate\Contracts\View\View | \Illuminate\Contracts\View\Factory | \Illuminate\Foundation\Application | \Illuminate\Contracts\Support\Htmlable | string | \Closure | \Illuminate\Contracts\Foundation\Application
    {
        return view('link::toolbar');
    }
}
