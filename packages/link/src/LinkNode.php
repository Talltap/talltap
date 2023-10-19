<?php

namespace Talltap\Link;

use Tiptap\Core\Mark;
use Tiptap\Utils\HTML;

class LinkNode extends Mark
{
    public static $name = 'link';

    public function addOptions()
    {
        return [
            'HTMLAttributes' => [
                'target' => '_blank',
                'rel' => 'noopener noreferrer nofollow',
            ],
        ];
    }

    public function parseHTML()
    {
        return [
            [
                'tag' => 'a[href]',
            ],
        ];
    }

    public function addAttributes()
    {
        return [
            'href' => [],
            'target' => [],
            'rel' => [],
        ];
    }

    public function renderHTML($mark, $HTMLAttributes = [])
    {
        return [
            'a',
            HTML::mergeAttributes($this->options['HTMLAttributes'], $HTMLAttributes),
            0,
        ];
    }
}
