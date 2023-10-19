@props(['activeTrigger' => null])

<button {{$attributes}} type="button"
        @class([
        'relative inline-flex items-center px-3 py-2 hover:text-amber-200',
        'text-white' => $activeTrigger == null
])
        @if($activeTrigger)
            :class="typeof isActive == 'function' && isActive('{{$activeTrigger}}', updatedAt) ? 'text-amber-600' : 'text-white'"
        @endif
>
    {{$slot}}
</button>