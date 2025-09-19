// src/editor/note-editor.tsx
import { useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import type { JSONContent } from '@tiptap/core';
import { db } from '@/db/db';
import { debounce } from '@/lib/debounce';

type NoteEditorProps = {
    pageId: string;
    initialJSON?: JSONContent;
    onBeforeSave?: () => void; // <-- new
    onAfterSave?: () => void; // <-- new
};

export function NoteEditor({
    pageId,
    initialJSON,
    onBeforeSave,
    onAfterSave,
}: NoteEditorProps) {
    const save = useMemo(
        () =>
            debounce(async (json: JSONContent) => {
                onBeforeSave?.(); // signal "Saving…"
                try {
                    const now = Date.now();
                    await db.blocks.where({ pageId }).delete();
                    await db.blocks.add({
                        id: crypto.randomUUID(),
                        pageId,
                        type: 'paragraph',
                        contentJSON: json,
                        order: 0,
                        updatedAt: now,
                    });
                    await db.pages.update(pageId, { updatedAt: now });
                } finally {
                    onAfterSave?.(); // signal "Saved"
                }
            }, 350),
        [pageId, onBeforeSave, onAfterSave]
    );

    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
        ],
        content: initialJSON ?? { type: 'doc', content: [] },
        onUpdate: ({ editor }) => save(editor.getJSON() as JSONContent),
    });

    return <EditorContent editor={editor} />;
}
