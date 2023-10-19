<?php

namespace Talltap\Talltap\Concerns;

use Talltap\Talltap\Contracts\HasTallEditor;

trait BelongsToLivewire
{
    protected HasTallEditor $livewire;

    public function livewire(HasTallEditor $livewire): static
    {
        $this->livewire = $livewire;

        return $this;
    }

    public function getLivewire(): HasTallEditor
    {
        return $this->livewire;
    }
}
