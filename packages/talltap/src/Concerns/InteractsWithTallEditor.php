<?php

namespace Talltap\Talltap\Concerns;

use Closure;
use Exception;
use Livewire\Features\SupportFileUploads\WithFileUploads;
use Modules\Cockpit\Extensions\SpatieMediaLibraryImage;
use Talltap\Support\Facades\TalltapExtension;
use Talltap\Talltap\EditorComponent;
use Talltap\Talltap\Talltap;
use Tiptap\Editor as TipTapEditor;
use Tiptap\Extensions\StarterKit;
use Tiptap\Marks\Link;

trait InteractsWithTallEditor
{
    use ResolvesDynamicLivewireProperties;
    use WithFileUploads;

    /**
     * @var array<string, EditorComponent>
     */
    protected ?array $cachedEditors = null;

    protected bool $hasCachedEditors = false;

    protected bool $isCachingEditors = false;

    protected function render(string $in, array $images = []): TipTapEditor
    {
        $tiptap = self::tiptapEditor($images);
        $tiptap->setContent($in);

        return $tiptap;
    }

    protected static function tiptapEditor($images = []): TipTapEditor
    {
        return new TipTapEditor([
            'extensions' => [
                new StarterKit(['heading' => false]),
                new SpatieMediaLibraryImage(['Images' => $images]),
                new Link(),
                ...TalltapExtension::getNodes(),
            ],
        ]);
    }

    public function getEditor(string $name): ?EditorComponent
    {
        return $this->getCachedEditors()[$name] ?? null;
    }

    /**
     * @return array<string, EditorComponent>
     */
    protected function cacheEditors(): array
    {
        $this->isCachingEditors = true;

        $this->cachedEditors = collect($this->getEditors())
//            ->merge($this->getTraitEditors())
            ->mapWithKeys(function (EditorComponent | string | null $editor, string | int $editorName): array {
                if ($editor === null) {
                    return ['' => null];
                }

                if (is_string($editorName)) {
                    return [$editorName => $editor];
                }

                if (! method_exists($this, $editor)) {
                    $livewireClass = $this::class;

                    throw new Exception("Editor configuration method [{$editorName}()] is missing from Livewire component [{$livewireClass}].");
                }

                return [$editor => $this->{$editor}($this->makeEditor())];
            })
            ->forget('')
            ->all();

        $this->isCachingEditors = false;

        $this->hasCachedEditors = true;

        //        foreach ($this->mountedFormComponentActions as $actionNestingIndex => $actionName) {
        //            $this->cacheForm(
        //                "mountedFormComponentActionForm{$actionNestingIndex}",
        //                $this->getMountedFormComponentActionForm($actionNestingIndex),
        //            );
        //        }

        return $this->cachedEditors;
    }

    /**
     * @return array<int | string, string | EditorComponent>
     */
    protected function getEditors(): array
    {
        return [
            'editor',
        ];
    }

    /**
     * @return array<string, EditorComponent>
     */
    public function getCachedEditors(): array
    {
        if (! $this->hasCachedEditors) {
            return $this->cacheEditors();
        }

        return $this->cachedEditors;
    }

    protected function cacheEditor(string $name, EditorComponent | Closure | null $editor): ?EditorComponent
    {
        $this->isCachingEditors = true;

        $editor = value($editor);

        if ($editor) {
            $this->cachedEditors[$name] = $editor;
        } else {
            unset($this->cachedEditors[$name]);
        }

        $this->isCachingEditors = false;

        return $editor;
    }

    protected function makeEditor(): Talltap
    {
        return Talltap::make($this);
    }

    public function isCachingEditors(): bool
    {
        return $this->isCachingEditors;
    }
}
