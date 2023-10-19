<?php

namespace Talltap\Talltap;

use Illuminate\Support\Collection;

class Talltap extends EditorComponent
{
    public string $modelProperty;

    public array $configuration = [];

    public ?Collection $extensionsInternal = null;

    public function contentProperty(string $contentProperty)
    {
        $this->modelProperty = $contentProperty;

        return $this;
    }

    public function configuration(array $configuration)
    {
        $this->configuration = $configuration;

        return $this;
    }

    public function getModelProperty()
    {
        return $this->modelProperty;
    }

    public function getConfiguration()
    {
        return $this->configuration;
    }

    public function getExtensions(): Collection
    {
        if ($this->extensionsInternal == null) {
            $this->extensionsInternal = collect(config('talltap.extensions', []));
        }

        return $this->extensionsInternal;
    }

    public function extensions(array $extensions)
    {
        $this->extensionsInternal = collect([...config('talltap.extensions', []), ...$extensions])->map(fn ($ext) => is_string($ext)? (new $ext) : $ext);

        return $this;
    }
}
