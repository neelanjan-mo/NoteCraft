// src/editor/editor-toolbar.tsx
import { Editor } from '@tiptap/react';

export function EditorToolbar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;
    return (
        <div className="flex gap-2 border-b p-2">
            <button
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
            >
                H1
            </button>
            <button
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
            >
                H2
            </button>
            <button
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
            >
                H3
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                • List
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                1. List
            </button>
            <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
                ☑ Checklist
            </button>
        </div>
    );
}
