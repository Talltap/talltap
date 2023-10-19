<span
    class="isolate inline-flex divide-x"
    x-data="youtubeBubble()"
    x-bind="bubbleMenuRef"
>
    <button
        @click="deleteEmbedd()"
        type="button"
        alt="remove link"
        class="relative inline-flex items-center px-3 py-2 hover:text-gray-50"
    >
        <x-ri-delete-bin-2-line class="h-4 w-4 text-white" />
    </button>
</span>

<script>
    function youtubeBubble() {
        return {
            ...bubbleMenuRef("youtube"),
            deleteEmbedd() {
                this.editor()
                    .chain()
                    .extendMarkRange("link")
                    .unsetLink()
                    .focus()
                    .run();
            },
        };
    }
</script>
