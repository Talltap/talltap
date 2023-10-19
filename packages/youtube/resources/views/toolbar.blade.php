<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<span class="isolate inline-flex rounded-md shadow-sm" x-data="youtube()">
    <button
        type="button"
        class="relative -ml-px inline-flex items-center rounded-l-md rounded-r-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
        :class="isActive('youtube') ? 'text-white bg-slate-500 hover:bg-slate-500' : 'text-gray-400 bg-white'"
        @click="openModal()"
    >
        <span class="sr-only">Add youtube link</span>
        <x-ri-youtube-line class="h-4 w-4" />
    </button>
</span>
<script>
    function youtube() {
        return {
            openModal() {
                Swal.fire({
                    title: "Youtube",
                    html: `
            <input type="text" id="url" class="swal2-input" placeholder="https://www.youtube.com/watch?v=">
          `,
                    confirmButtonText: "Embedd",
                    focusConfirm: false,
                    preConfirm: () => {
                        const url = Swal.getPopup().querySelector("#url").value;
                        if (!url) {
                            Swal.showValidationMessage(
                                `Please enter a youtube url`
                            );
                        }
                        return { url };
                    },
                }).then((result) => {
                    this.editor().commands.setYoutubeVideo({
                        src: result.value.url,
                        width: 640,
                        height: 480,
                    });
                });
            },
        };
    }
</script>
