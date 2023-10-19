<?php

namespace Talltap\Talltap;

use Talltap\Talltap\Components\ViewComponent;
use Talltap\Talltap\Concerns\BelongsToLivewire;
use Talltap\Talltap\Contracts\HasTallEditor;

class EditorComponent extends ViewComponent
{
    use BelongsToLivewire;

    protected string $view = 'talltap::editor';

    protected string $evaluationIdentifier = 'container';

    protected string $viewIdentifier = 'container';

    final public function __construct(HasTallEditor $livewire)
    {
        $this->livewire($livewire);
    }

    public static function make(HasTallEditor $livewire): static
    {
        return app(static::class, ['livewire' => $livewire]);
    }

    /**
     * @return array<mixed>
     */
    protected function resolveDefaultClosureDependencyForEvaluationByName(string $parameterName): array
    {
        return match ($parameterName) {
            'livewire' => [$this->getLivewire()],
            default => $this->resolveDefaultClosureDependencyForEvaluationByName($parameterName),
        };
    }
}
