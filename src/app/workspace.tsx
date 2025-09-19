// src/app/workspace.tsx
import { useEffect, useMemo, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { db } from '@/db/db';
import { NoteEditor } from '@/editor/note-editor';
import { TreePane } from '@/app/tree-pane';
import { QuickSearch } from '@/app/quick-search';
import { BackupButtons } from '@/app/backup-buttons';
import { registerRuntimeHandlers } from '@/app/runtime-listeners';

const LAST_PAGE_KEY = 'notecraft:lastPageId';

export function Workspace() {
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [initialJSON, setInitialJSON] = useState<JSONContent | undefined>(
        undefined
    );
    const [isSaving, setIsSaving] = useState(false);

    // Register background->app runtime listeners (e.g., context-menu clipper)
    useEffect(() => {
        const off = registerRuntimeHandlers();
        return () => off();
    }, []);

    // Bootstrap: create first page if none; otherwise restore last opened or most-recently updated
    useEffect(() => {
        (async () => {
            const count = await db.pages.count();
            if (count === 0) {
                const id = crypto.randomUUID();
                const now = Date.now();
                await db.pages.add({
                    id,
                    folderId: null,
                    title: 'Untitled',
                    createdAt: now,
                    updatedAt: now,
                });
                setCurrentPageId(id);
                localStorage.setItem(LAST_PAGE_KEY, id);
                return;
            }

            const lastId = localStorage.getItem(LAST_PAGE_KEY);
            if (lastId) {
                const exists = await db.pages.get(lastId);
                if (exists) {
                    setCurrentPageId(lastId);
                    return;
                }
            }

            const mostRecent = await db.pages
                .orderBy('updatedAt')
                .reverse()
                .first();
            if (mostRecent) setCurrentPageId(mostRecent.id);
        })();
    }, []);

    // Load page title + content on selection change and persist last selection
    useEffect(() => {
        if (!currentPageId) return;
        (async () => {
            localStorage.setItem(LAST_PAGE_KEY, currentPageId);

            const page = await db.pages.get(currentPageId);
            setTitle(page?.title ?? '');

            const block = await db.blocks
                .where({ pageId: currentPageId })
                .first();
            setInitialJSON(block?.contentJSON ?? { type: 'doc', content: [] });
        })();
    }, [currentPageId]);

    // Save-state callbacks used by the editor
    const onBeforeSave = useMemo(() => () => setIsSaving(true), []);
    const onAfterSave = useMemo(() => () => setIsSaving(false), []);

    return (
        <div className="flex h-screen">
            <TreePane onSelectPage={setCurrentPageId} />

            <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 p-2 border-b">
                    <input
                        className="text-lg font-medium bg-transparent outline-none"
                        value={title}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                        onBlur={async (e) =>
                            currentPageId &&
                            db.pages.update(currentPageId, {
                                title: e.currentTarget.value,
                                updatedAt: Date.now(),
                            })
                        }
                        placeholder="Untitled"
                    />

                    {/* Quick Search */}
                    <QuickSearch onSelect={(id) => setCurrentPageId(id)} />

                    {/* Export / Import */}
                    <BackupButtons />

                    <span className="ml-auto text-xs text-muted-foreground">
                        {isSaving ? 'Saving…' : 'Saved'}
                    </span>
                </div>

                <div className="p-2">
                    {currentPageId ? (
                        <NoteEditor
                            pageId={currentPageId}
                            initialJSON={initialJSON}
                            onBeforeSave={onBeforeSave}
                            onAfterSave={onAfterSave}
                        />
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Select or create a page to start writing.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
