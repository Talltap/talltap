<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<span>
        <button type="button"
                x-data="link()"
                @click="openModal()"
                @class([
                    'relative -ml-px inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 rounded-r-md rounded-l-md'
                ])
                :class="isActive('link', updatedAt) ? 'text-white bg-slate-500 hover:bg-slate-500' : 'text-gray-400 bg-white'"
        >
                <span class="sr-only">Insert link</span>
                <x-ri-link class="w-4 h-4" />
              </button>
</span>
<script>
  function link() {
    return {
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
            return { url };
          }
        }).then((result) => {
          const url = result?.value?.url;
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
            .setLink({ href: url })
            .run();
        });
      }
    };
  }
</script>