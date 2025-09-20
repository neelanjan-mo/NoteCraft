// src/app/page-view.tsx
import type { JSONContent } from '@tiptap/core';
import { db } from '@/db/db';
import { NoteEditor } from '@/editor/note-editor';

export function PageView({
    pageId,
    title,
    initialJSON,
    isSaving,
    onTitleChange,
    onBeforeSave,
    onAfterSave,
    onBack,
}: {
    pageId: string;
    title: string;
    initialJSON?: JSONContent;
    isSaving: boolean;
    onTitleChange: (v: string) => void;
    onBeforeSave: () => void;
    onAfterSave: () => void;
    onBack: () => void;
}) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-3">
                <button
                    className="text-sm text-muted-foreground"
                    onClick={onBack}
                >
                    ← Back
                </button>
                <input
                    className="text-lg font-medium bg-transparent outline-none flex-1"
                    value={title}
                    onChange={(e) => onTitleChange(e.currentTarget.value)}
                    onBlur={async (e) =>
                        db.pages.update(pageId, {
                            title: e.currentTarget.value,
                            updatedAt: Date.now(),
                        })
                    }
                    placeholder="Untitled"
                />
                <span className="text-xs text-muted-foreground">
                    {isSaving ? 'Saving…' : 'Saved'}
                </span>
            </div>

            <div className="tiptap border rounded-md">
                <NoteEditor
                    pageId={pageId}
                    initialJSON={initialJSON}
                    onBeforeSave={onBeforeSave}
                    onAfterSave={onAfterSave}
                />
            </div>
        </div>
    );
}
