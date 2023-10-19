<span x-data="linkBubble()" x-bind="bubbleMenuRef">
    <x-talltap::bubble-menu>
        <x-talltap::bubble-menu.item @click="removeLink" alt="remove link">
            <x-ri-link-unlink class="w-4 h-4"/>
        </x-talltap::bubble-menu.item>

        <x-talltap::bubble-menu.item @click="openModal" alt="remove link">
            <x-ri-edit-2-line class="w-4 h-4"/>
        </x-talltap::bubble-menu.item>

        <x-talltap::bubble-menu.item @click="goToUrl" alt="remove link">
            <x-ri-external-link-line class="w-4 h-4"/>
        </x-talltap::bubble-menu.item>
    </x-talltap::bubble-menu>
</span>
<script>

    function linkBubble() {
        return {
            ...bubbleMenuRef('link'),
            goToUrl() {
                window.open(this.editor().getAttributes("link").href ?? null, '_blank');
            },
            openModal() {
                const previousUrl = this.editor().getAttributes("link").href ?? "";
                Swal.fire({
                    title: "Link",
                    html: `
            <input type="text" id="url" class="swal2-input" value="${previousUrl}" placeholder="https://example.com">
          `,
                    confirmButtonText: "Add Link",
                    focusConfirm: false,
                    preConfirm: () => {
                        const url = Swal.getPopup().querySelector("#url").value;
                        if (!url) {
                            Swal.showValidationMessage(`Please enter a valid url`);
                        }
                        return {url};
                    }
                }).then((result) => {
                    const url = result.value.url;
                    if (url === null) {
                        return;
                    }

                    if (url === "") {
                        this.editor().chain().focus().extendMarkRange("link").unsetLink().run();

                        return;
                    }

                    // update link
                    this.editor()
                        .chain()
                        .focus()
                        .extendMarkRange("link")
                        .setLink({href: url})
                        .run();
                });
            },
            removeLink() {
                this.editor().chain().extendMarkRange("link").unsetLink().focus().run();
            }
        };
    }
</script>