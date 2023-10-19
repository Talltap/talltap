<div>
    <livewire:talleditor wire:model="{{$getModelProperty()}}" :configuration="$getConfiguration()"></livewire:talleditor>
    <script>
        window.talltapRegistry.init({{ Illuminate\Support\Js::from($getConfiguration()) }});
    </script>
</div>