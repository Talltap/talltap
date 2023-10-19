<span
    class="isolate inline-flex divide-x"
    x-data="imageBubble()"
    x-bind="bubbleMenuRef"
>
    <button
        @click="removeImage()"
        type="button"
        alt="remove link"
        class="relative inline-flex items-center px-3 py-2 hover:text-gray-50"
    >
        <x-ri-delete-bin-2-line class="h-4 w-4 text-white" />
    </button>
</span>

<script>
    function imageBubble() {
        return {
            ...bubbleMenuRef("image"),
            removeImage() {
                const state = this.editor().state;
                const view = this.editor().view;
                const transaction = state.tr;
                const pos = state.selection.$anchor.pos;

                const nodeSize = state.selection.node.nodeSize;

                transaction.delete(pos, pos + nodeSize);

                view.dispatch(transaction);
            },
        };
    }
</script>
