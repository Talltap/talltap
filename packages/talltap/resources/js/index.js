import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import CharacterCount from "@tiptap/extension-character-count";
import StarterKit from "@tiptap/starter-kit";
import BubbleMenu from "@tiptap/extension-bubble-menu";

const config = {
    document: Document.extend({
        content: "heading block*",
    }),
    editorProps: {
        attributes: {
            class:
                "prose prose-sm sm:prose lg:prose-lg xl:prose-lg focus:outline-none",
        },
    },
};

document.addEventListener("alpine:init", () => {
    Alpine.data("talltap", (content, bubbleMenuActiveTrigger) => {
        const ref = "tallEditor";
        if (!window.talltap) {
            window.talltap = {};
        }
        let editor = window.talltap[ref];

        return {
            updatedAt: Date.now(), // force Alpine to rerender on selection change
            content: content,
            output: undefined,
            data: {},
            init() {
                const _this = this;

                if (editor !== undefined) {
                    return;
                }

                editor = new Editor({
                    element: this.$refs.tiptap,
                    editorProps: config.editorProps,
                    extensions: [
                        config.document, ...window.talltapRegistry.getExtensions(),
                        StarterKit.configure({
                            codeBlock: false,
                            document: false,
                            dropcursor: {
                                color: "skyblue",
                                width: 2
                            }
                        }),
                        BubbleMenu.configure({
                            pluginKey: "talltap-bubble-menu",
                            // @ts-ignore
                            element: document.getElementById('bubbleMenu'),//this.$refs.bubbleMenu,
                            shouldShow: ({ editor }) => bubbleMenuActiveTrigger.some(trigger => editor.isActive(trigger) || (trigger === '*' && !editor.view.state.selection.empty)),
                        }),
                        CharacterCount
                    ],
                    content: content,
                    onCreate({ editor }) {
                        _this.updatedAt = Date.now();
                        _this.createExternalData(editor);
                        _this.$dispatch("update");
                    },
                    onUpdate({ editor }) {
                        _this.updatedAt = Date.now();
                        _this.updateExternalData(editor);
                        _this.$dispatch("update");
                    },
                    onSelectionUpdate({ editor }) {
                        _this.updatedAt = Date.now();
                        _this.$dispatch("update");
                    },
                });
                window.talltap[ref] = editor;
            },
            editor() {
                return editor;
            },
            createExternalData(editor) {
                this.data.characterCount = editor.storage.characterCount.characters();
            },
            updateExternalData(editor) {
                this.data.characterCount = editor.storage.characterCount.characters();
                this.content = editor.getHTML();
                this.debounceOutput();
            },
            debounceOutput() {
                if (!this.output) {
                    this.output = Alpine.debounce(
                        () => {
                            this.$wire.set("value", this.content);
                            this.$dispatch('content-updated');
                        },
                        500,
                    );
                    return;
                }
                this.output();
            },
            isActive(type, opts = {}) {
                return editor.isActive(type, opts);
            },
        };
    });
});
