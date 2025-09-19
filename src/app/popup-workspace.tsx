import { useMemo, useState } from 'react';
import { HomeList } from '@/app/home-list';
import { FolderList } from '@/app/folder-list';
import { PageView } from '@/app/page-view';
import { BottomBar } from '@/app/bottom-bar';
import { QuickSearch } from '@/app/quick-search';
import { BackupButtons } from '@/app/backup-buttons';
import { db } from '@/db/db';
import browser from 'webextension-polyfill';
import type { JSONContent } from '@tiptap/core';

type View = 'home' | 'folder' | 'page';

export function PopupWorkspace() {
    const [view, setView] = useState<View>('home');
    const [folderId, setFolderId] = useState<string | null>(null);
    const [pageId, setPageId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [initialJSON, setInitialJSON] = useState<JSONContent | undefined>();

    // Add saving state + callbacks required by PageView
    const [isSaving, setIsSaving] = useState(false);
    const onBeforeSave = useMemo(() => () => setIsSaving(true), []);
    const onAfterSave = useMemo(() => () => setIsSaving(false), []);

    function openFolder(id: string) {
        setFolderId(id);
        setView('folder');
    }

    function openPage(id: string) {
        setPageId(id);
        setView('page');
        // lazy-load title + content
        (async () => {
            const page = await db.pages.get(id);
            setTitle(page?.title ?? '');
            const block = await db.blocks.where({ pageId: id }).first();
            setInitialJSON(block?.contentJSON ?? { type: 'doc', content: [] });
        })();
    }

    function backHome() {
        setView('home');
        setFolderId(null);
        setPageId(null);
    }

    return (
        <div className="w-[800px] h-[600px] overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 p-2 border-b">
                <div className="text-lg font-medium">NoteCraft</div>
                <QuickSearch onSelect={openPage} />
                <BackupButtons />
                <button
                    className="ml-auto underline text-sm"
                    onClick={() => browser.runtime.openOptionsPage()}
                >
                    Open in Tab
                </button>
            </div>

            <div className="flex-1 overflow-auto pb-20 p-3">
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

            <BottomBar
                onNewFolder={async () => {
                    const id = crypto.randomUUID();
                    const now = Date.now();
                    await db.folders.add({
                        id,
                        parentId: null,
                        name: 'New folder',
                        createdAt: now,
                        updatedAt: now,
                        sort: now,
                    });
                    openFolder(id);
                }}
                onNewPage={async () => {
                    const id = crypto.randomUUID();
                    const now = Date.now();
                    await db.pages.add({
                        id,
                        folderId: null,
                        title: 'Untitled',
                        createdAt: now,
                        updatedAt: now,
                    });
                    openPage(id);
                }}
            />
        </div>
    );
}
