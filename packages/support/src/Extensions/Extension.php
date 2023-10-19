<?php

namespace Talltap\Support\Extensions;

abstract class Extension
{
    protected string $id;

    protected string $package;

    protected ?string $class = null;

    public function __construct(string $id, ?string $class = null)
    {
        $this->id = $id;
        $this->class = $class;
    }

    public static function make(string $id, ?string $class = null): static
    {
        return app(static::class, ['id' => $id, 'class' => $class]);
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function package(string $package): static
    {
        $this->package = $package;

        return $this;
    }

    public function getPackage(): string
    {
        return $this->package;
    }

    public function getClass(): string
    {
        return $this->class;
    }

    public function boot(): void
    {
    }
}
