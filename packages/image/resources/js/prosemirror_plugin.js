import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";


export const placeholderPlugin = new Plugin({
    key: new PluginKey("talltap-image-placeholder"),
    state: {
        init() {
            return DecorationSet.empty;
        },
        apply(tr, set) {
            // Adjust decoration positions to changes made by the transaction
            set = set.map(tr.mapping, tr.doc);
            // See if the transaction adds or removes any placeholders
            let action = tr.getMeta(this);
            if (action && action.add) {
                let widget = document.createElement("div");
                widget.insertAdjacentHTML(
                    "afterbegin",
                    `
        <div class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <span class="loading loading-spinner loading-lg mx-auto"></span>
        </div>
        `,
                );
                let deco = Decoration.widget(action.add.pos, widget, {
                    id: action.add.id,
                });
                set = set.add(tr.doc, [deco]);
            } else if (action && action.remove) {
                set = set.remove(
                    set.find(null, null, (spec) => spec.id == action.remove.id),
                );
            }
            return set;
        },
    },
    props: {
        decorations(state) {
            return this.getState(state);
        },
    },
});

function findPlaceholder(state, id) {
    let decos = placeholderPlugin.getState(state);
    let found = decos.find(null, null, (spec) => spec.id == id);
    return found.length ? found[0].from : null;
}

export const uploadImagePlugin = (upload) => {
    return new Plugin({
        key: new PluginKey("talltap-image"),
        props: {
            handlePaste(view, event) {
                console.log("----onhandlePaste image---");

                const items = Array.from(event.clipboardData?.items || []);
                const { schema } = view.state;

                console.log({ items });

                items.forEach((item) => {
                    const image = item.getAsFile();

                    console.log({ image, item });

                    if (item.type.indexOf("image") === 0) {
                        console.log("item is an image");
                        event.preventDefault();

                        if (upload && image) {
                            upload(image).then((res) => {
                                const node = schema.nodes.image.create({
                                    src: res.src,
                                    alt: res.ref,
                                });
                                const transaction = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                            });
                        }
                    } else {
                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                            const node = schema.nodes.image.create({
                                src: readerEvent.target?.result,
                            });
                            const transaction = view.state.tr.replaceSelectionWith(node);
                            view.dispatch(transaction);
                        };
                        if (!image) return;
                        reader.readAsDataURL(image);
                    }
                });

                return false;
            },
            handleDOMEvents: {
                drop(view, event) {
                    console.log("----handleDom.onDrop----");
                    const hasFiles = event.dataTransfer?.files?.length;

                    if (!hasFiles) {
                        return false;
                    }

                    const images = Array.from(event.dataTransfer.files).filter((file) =>
                        /image/i.test(file.type),
                    );

                    if (images.length === 0) {
                        return false;
                    }

                    event.preventDefault();

                    const { schema } = view.state;
                    const coordinates = view.posAtCoords({
                        left: event.clientX,
                        top: event.clientY,
                    });

                    let tr = view.state.tr;
                    if (!tr.selection.empty) tr.deleteSelection();
                    images.forEach(async (image) => {
                        tr.setMeta(placeholderPlugin, {
                            add: { id: image.name, pos: coordinates.pos },
                        });
                    });
                    view.dispatch(tr);

                    images.forEach(async (image) => {
                        const reader = new FileReader();

                        if (upload) {
                            const res = await upload(image);
                            // const node = schema.nodes.image.create({
                            //   src: res.src,
                            //   alt: res.ref,
                            // });
                            // const transaction = view.state.tr.insert(coordinates!.pos, node);
                            // view.dispatch(transaction);

                            let pos = findPlaceholder(view.state, image.name);

                            view.dispatch(
                                view.state.tr
                                    .replaceWith(
                                        pos,
                                        pos,
                                        schema.nodes.image.create({ src: res.src, alt: res.ref }),
                                    )
                                    .setMeta(placeholderPlugin, { remove: { id: image.name } }),
                            );
                        } else {
                            reader.onload = (readerEvent) => {
                                console.log("i couldn't get an upload function");
                                const node = schema.nodes.image.create({
                                    src: readerEvent.target?.result,
                                });
                                const transaction = view.state.tr.insert(
                                    coordinates.pos,
                                    node,
                                );
                                view.dispatch(transaction);
                            };
                            reader.readAsDataURL(image);
                        }
                    });
                    return false;
                },
            },
        },
    });
};
