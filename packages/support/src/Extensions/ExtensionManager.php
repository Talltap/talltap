<?php

namespace Talltap\Support\Extensions;

use Illuminate\Support\Arr;

class ExtensionManager
{
    /**
     * @var array<string, Toolbar>
     */
    protected array $toolbarComponents = [];

    /**
     * @var array<string, BubbleMenu>
     */
    protected array $bubbleMenuComponents = [];

    protected array $nodes = [];

    public function register(array $extensions, string $package = 'app'): void
    {
        foreach ($extensions as $extension) {
            $extension->package($package);

            $extension->boot();

            match (true) {
                $extension instanceof Toolbar => $this->toolbarComponents[$package][] = $extension,
                $extension instanceof BubbleMenu => $this->bubbleMenuComponents[$package][] = $extension,
                $extension instanceof Node => $this->nodes[$package][] = $extension,
                default => null,
            };
        }
    }

    public function getToolbarComponents(?array $packages = null): array
    {
        return $this->getFiltered($this->toolbarComponents, $packages);
    }

    public function getBubbleMenuComponents(?array $packages = null): array
    {
        return $this->getFiltered($this->bubbleMenuComponents, $packages);
    }

    public function getNodes(?array $packages = null): array
    {
        return $this->getFiltered($this->nodes, $packages);
    }

    /**
     * @param  array<Extension>  $extensions
     * @param  array<string> | null  $packages
     * @return array<Extension>
     */
    protected function getFiltered(array $extensions, ?array $packages = null): array
    {
        if ($packages !== null) {
            $extensions = Arr::only($extensions, $packages);
        }

        return Arr::flatten($extensions);
    }
}
