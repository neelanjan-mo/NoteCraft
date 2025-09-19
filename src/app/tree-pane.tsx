// src/app/tree-pane.tsx
import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '@/db/db';
import {
    createFolder,
    createPage,
    renameFolder,
    renamePage,
    deleteFolder,
    deletePage,
} from '@/db/dao';
import type { Folder, Page } from '@/db/db';

export function TreePane({
    onSelectPage,
}: {
    onSelectPage: (id: string) => void;
}) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [pages, setPages] = useState<Page[]>([]);

    useEffect(() => {
        const subFolders = liveQuery(() => db.folders.toArray()).subscribe({
            next: (rows) => setFolders(rows),
            error: console.error,
        });
        const subPages = liveQuery(() => db.pages.toArray()).subscribe({
            next: (rows) => setPages(rows),
            error: console.error,
        });
        return () => {
            subFolders.unsubscribe();
            subPages.unsubscribe();
        };
    }, []);

    async function onAddFolder() {
        await createFolder('New folder');
    }
    async function onAddPage(folderId: string | null) {
        const id = await createPage('Untitled', folderId);
        onSelectPage(id);
    }

    return (
        <div className="w-72 border-r h-full p-2 space-y-2">
            <div className="flex gap-2">
                <button className="btn" onClick={onAddFolder}>
                    + Folder
                </button>
                <button className="btn" onClick={() => onAddPage(null)}>
                    + Page
                </button>
            </div>

            <div className="space-y-2">
                {folders.map((f) => (
                    <div key={f.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <input
                                className="w-full bg-transparent"
                                defaultValue={f.name}
                                onBlur={(e) =>
                                    renameFolder(f.id, e.currentTarget.value)
                                }
                            />
                            <button onClick={() => onAddPage(f.id)}>
                                + Page
                            </button>
                            <button onClick={() => deleteFolder(f.id)}>
                                ✕
                            </button>
                        </div>

                        <div className="pl-4 space-y-1">
                            {pages
                                .filter((p) => p.folderId === f.id)
                                .map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between"
                                    >
                                        <button
                                            className="text-left truncate"
                                            onClick={() => onSelectPage(p.id)}
                                        >
                                            {p.title || 'Untitled'}
                                        </button>
                                        <input
                                            className="w-32 bg-transparent"
                                            defaultValue={p.title}
                                            onBlur={(e) =>
                                                renamePage(
                                                    p.id,
                                                    e.currentTarget.value
                                                )
                                            }
                                        />
                                        <button
                                            onClick={() => deletePage(p.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                {/* Root-level pages */}
                {pages
                    .filter((p) => !p.folderId)
                    .map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between"
                        >
                            <button
                                className="text-left truncate"
                                onClick={() => onSelectPage(p.id)}
                            >
                                {p.title || 'Untitled'}
                            </button>
                            <input
                                className="w-32 bg-transparent"
                                defaultValue={p.title}
                                onBlur={(e) =>
                                    renamePage(p.id, e.currentTarget.value)
                                }
                            />
                            <button onClick={() => deletePage(p.id)}>✕</button>
                        </div>
                    ))}
            </div>
        </div>
    );
}
