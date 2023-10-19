<?php

namespace Talltap\Talltap\Components;

use Closure;
use Exception;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Contracts\View\View;
use Illuminate\View\ComponentAttributeBag;
use ReflectionClass;
use ReflectionMethod;

abstract class ViewComponent implements Htmlable
{
    protected string $view;

    protected string | Closure | null $defaultView = null;

    /**
     * @var array<string, mixed>
     */
    protected array $viewData = [];

    protected string $viewIdentifier;

    /**
     * @var array<string, array<string>>
     */
    protected static array $methodCache = [];

    /**
     * @param  array<string, mixed>  $viewData
     */
    public function view(?string $view, array $viewData = []): static
    {
        if ($view === null) {
            return $this;
        }

        $this->view = $view;

        if ($viewData !== []) {
            $this->viewData($viewData);
        }

        return $this;
    }

    /**
     * @param  view-string | Closure | null  $view
     */
    public function defaultView(string | Closure | null $view): static
    {
        $this->defaultView = $view;

        return $this;
    }

    /**
     * @return array<string, Closure>
     */
    protected function extractPublicMethods(): array
    {
        if (! isset(static::$methodCache[static::class])) {
            $reflection = new ReflectionClass($this);

            static::$methodCache[static::class] = array_map(
                fn (ReflectionMethod $method): string => $method->getName(),
                $reflection->getMethods(ReflectionMethod::IS_PUBLIC),
            );
        }

        $values = [];

        foreach (static::$methodCache[static::class] as $method) {
            $values[$method] = Closure::fromCallable([$this, $method]);
        }

        return $values;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function viewData(array $data): static
    {
        $this->viewData = [
            ...$this->viewData,
            ...$data,
        ];

        return $this;
    }

    public function getView(): string
    {
        if (isset($this->view)) {
            return $this->view;
        }

        throw new Exception('Class [' . static::class . '] extends [' . ViewComponent::class . '] but does not have a [$view] property defined.');
    }

    public function toHtml(): string
    {
        return $this->render()->render();
    }

    public function render(): View
    {
        return view(
            $this->getView(),
            [
                'attributes' => new ComponentAttributeBag(),
                ...$this->extractPublicMethods(),
                ...(isset($this->viewIdentifier) ? [$this->viewIdentifier => $this] : []),
                ...$this->viewData,
            ],
        );
    }
}
