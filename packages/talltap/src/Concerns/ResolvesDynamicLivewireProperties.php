<?php

namespace Talltap\Talltap\Concerns;

use Livewire\Exceptions\PropertyNotFoundException;
use Talltap\Talltap\Contracts\HasTallEditor;

trait ResolvesDynamicLivewireProperties
{
    /**
     * @param  string  $property
     *
     * @throws PropertyNotFoundException
     */
    public function __get($property): mixed
    {
        try {
            return parent::__get($property);
        } catch (PropertyNotFoundException $exception) {
        }

        if (
            $this instanceof HasTallEditor &&
            (! $this->isCachingEditors()) &&
            $form = $this->getEditor($property)
        ) {
            return $form;
        }

        throw $exception;
    }
}
