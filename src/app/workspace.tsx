// src/app/workspace.tsx
import { useEffect, useMemo, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { db } from '@/db/db';
import { NoteEditor } from '@/editor/note-editor';
import { QuickSearch } from '@/app/quick-search';
import { BackupButtons } from '@/app/backup-buttons';
import { registerRuntimeHandlers } from '@/app/runtime-listeners';
import { HomeList } from '@/app/home-list';
import { FolderList } from '@/app/folder-list';
import { BottomBar } from '@/app/bottom-bar';
import { createFolder, createPage } from '@/db/dao';

type View = 'home' | 'folder' | 'page';
const LAST_PAGE_KEY = 'notecraft:lastPageId';

export function Workspace() {
    // Navigation state
    const [view, setView] = useState<View>('home');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        null
    );

    // Page state (populated only in page view)
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [initialJSON, setInitialJSON] = useState<JSONContent | undefined>(
        undefined
    );
    const [isSaving, setIsSaving] = useState(false);

    // Background → App messages (context-menu clipper)
    useEffect(() => {
        const off = registerRuntimeHandlers();
        return () => off();
    }, []);

    // First-run bootstrap: ensure at least one page exists, but land on Home
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
                // Do NOT navigate to page; IA requires list-first
                localStorage.setItem(LAST_PAGE_KEY, id);
            }
        })();
    }, []);

    // Load page data whenever a page is opened
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

    // Navigation handlers
    function openFolder(id: string) {
        setSelectedFolderId(id);
        setView('folder');
    }
    function openPage(id: string) {
        setCurrentPageId(id);
        setView('page');
    }
    function backToHome() {
        setView('home');
        setSelectedFolderId(null);
        setCurrentPageId(null);
    }

    // Bottom bar actions
    async function handleNewFolder() {
        const id = await createFolder('New folder', null);
        setSelectedFolderId(id);
        setView('folder');
    }
    async function handleNewPage() {
        const id = await createPage('Untitled', null);
        setCurrentPageId(id);
        setView('page');
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Top utility bar: brand or title + search + backup + save indicator */}
            <div className="flex items-center gap-3 p-2 border-b">
                {view === 'page' ? (
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
                ) : (
                    <div className="text-lg font-medium">NoteCraft</div>
                )}

                <QuickSearch onSelect={(id) => openPage(id)} />
                <BackupButtons />

                <span className="ml-auto text-xs text-muted-foreground">
                    {view === 'page' ? (isSaving ? 'Saving…' : 'Saved') : null}
                </span>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto pb-20">
                {view === 'home' && (
                    <HomeList onOpenFolder={openFolder} onOpenPage={openPage} />
                )}

                {view === 'folder' && selectedFolderId && (
                    <FolderList
                        folderId={selectedFolderId}
                        onOpenPage={openPage}
                        onBack={backToHome}
                    />
                )}

                {view === 'page' && currentPageId && (
                    <div className="p-3 max-w-screen-lg mx-auto">
                        <button
                            className="mb-3 text-sm text-muted-foreground"
                            onClick={backToHome}
                        >
                            ← Back
                        </button>
                        <NoteEditor
                            pageId={currentPageId}
                            initialJSON={initialJSON}
                            onBeforeSave={onBeforeSave}
                            onAfterSave={onAfterSave}
                        />
                    </div>
                )}

                {!(['home', 'folder', 'page'] as View[]).includes(view) && (
                    <div className="p-3 text-sm text-muted-foreground">
                        Invalid state. Return to Home.
                        <button className="ml-2 underline" onClick={backToHome}>
                            Go Home
                        </button>
                    </div>
                )}
            </div>

            {/* Fixed bottom bar */}
            <BottomBar
                onNewFolder={handleNewFolder}
                onNewPage={handleNewPage}
            />
        </div>
    );
}
