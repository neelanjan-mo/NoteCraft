// src/app/app-workspace.tsx
import { useEffect, useMemo, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { db } from '@/db/db';
import { HomeList } from '@/app/home-list';
import { FolderList } from '@/app/folder-list';
import { PageView } from '@/app/page-view';
import { QuickSearch } from '@/app/quick-search';
import { BackupButtons } from '@/app/backup-buttons';
import { registerRuntimeHandlers } from '@/app/runtime-listeners';

type View = 'home' | 'folder' | 'page';
const LAST_PAGE_KEY = 'notecraft:lastPageId';

export function AppWorkspace() {
    const [view, setView] = useState<View>('home');
    const [folderId, setFolderId] = useState<string | null>(null);
    const [pageId, setPageId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [initialJSON, setInitialJSON] = useState<JSONContent | undefined>();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const off = registerRuntimeHandlers();
        return () => off();
    }, []);

    // Ensure we have at least one page on first run
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
                localStorage.setItem(LAST_PAGE_KEY, id);
            }
        })();
    }, []);

    // Load page content when opening a page
    async function loadPage(id: string) {
        const page = await db.pages.get(id);
        setTitle(page?.title ?? '');
        const block = await db.blocks.where({ pageId: id }).first();
        setInitialJSON(block?.contentJSON ?? { type: 'doc', content: [] });
        localStorage.setItem(LAST_PAGE_KEY, id);
    }

    const onBeforeSave = useMemo(() => () => setIsSaving(true), []);
    const onAfterSave = useMemo(() => () => setIsSaving(false), []);

    function openFolder(id: string) {
        setFolderId(id);
        setView('folder');
    }
    function openPage(id: string) {
        setPageId(id);
        setView('page');
        void loadPage(id);
    }
    function backHome() {
        setView('home');
        setFolderId(null);
        setPageId(null);
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Top bar */}
            <div className="flex items-center gap-3 p-2 border-b">
                <div className="text-lg font-medium">NoteCraft</div>
                <QuickSearch onSelect={openPage} />
                <BackupButtons />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3">
                {view === 'home' && (
                    <HomeList onOpenFolder={openFolder} onOpenPage={openPage} />
                )}
                {view === 'folder' && folderId && (
                    <FolderList
                        folderId={folderId}
                        onOpenPage={openPage}
                        onBack={backHome}
                    />
                )}
                {view === 'page' && pageId && (
                    <PageView
                        pageId={pageId}
                        title={title}
                        initialJSON={initialJSON}
                        isSaving={isSaving}
                        onTitleChange={setTitle}
                        onBeforeSave={onBeforeSave}
                        onAfterSave={onAfterSave}
                        onBack={backHome}
                    />
                )}
            </div>
        </div>
    );
}
