// src/app/folder-list.tsx
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Folder, Page } from '@/db/db';
import { Button } from '@/components/ui/button';
import { NamePopover } from '@/components/name-popover';

/** Reusable inline rename row for pages */
function InlineRenameRow({
    label,
    onOpen,
    onRename,
}: {
    label: string;
    onOpen: () => void;
    onRename: (name: string) => void | Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(label);

    return (
        <div
            className="group w-full flex items-center justify-between px-2 py-1 rounded hover:bg-accent"
            onDoubleClick={() => setEditing(true)}
        >
            {!editing ? (
                <button className="text-left truncate flex-1" onClick={onOpen}>
                    {label}
                </button>
            ) : (
                <input
                    className="bg-transparent flex-1 outline-none"
                    value={val}
                    onChange={(e) => setVal(e.currentTarget.value)}
                    onBlur={async () => {
                        const next = val.trim();
                        if (next) await onRename(next);
                        setEditing(false);
                    }}
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                            const next = val.trim();
                            if (next) await onRename(next);
                            setEditing(false);
                        }
                        if (e.key === 'Escape') {
                            setVal(label);
                            setEditing(false);
                        }
                    }}
                    autoFocus
                />
            )}
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                ↲ rename
            </span>
        </div>
    );
}

export function FolderList({
    folderId,
    onOpenPage,
    onBack,
}: {
    folderId: string;
    onOpenPage: (id: string) => void;
    onBack: () => void;
}) {
    const folder = useLiveQuery<Folder | undefined>(
        () => db.folders.get(folderId),
        [folderId]
    );
    const pages =
        useLiveQuery<Page[]>(
            () => db.pages.where({ folderId }).toArray(),
            [folderId]
        ) ?? [];

    // Folder title inline edit state
    const [editingFolder, setEditingFolder] = useState(false);
    const [folderNameDraft, setFolderNameDraft] = useState<string>(
        folder?.name ?? ''
    );

    // Sync draft when folder record changes
    useEffect(() => {
        if (!editingFolder) setFolderNameDraft(folder?.name ?? '');
    }, [folder?.name, editingFolder]);

    async function renameFolder(next: string) {
        const name = next.trim();
        if (!name) return;
        await db.folders.update(folderId, { name, updatedAt: Date.now() });
    }

    return (
        <div className="p-3 pb-20 max-w-screen-lg mx-auto">
            {/* Header: back, folder name (inline rename), New Page popover */}
            <div className="flex items-center justify-between mb-3 gap-2">
                <button
                    className="text-sm text-muted-foreground"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <div className="flex-1 flex items-center justify-center">
                    {!editingFolder ? (
                        <h1
                            className="text-lg font-medium truncate cursor-text"
                            onDoubleClick={() => setEditingFolder(true)}
                            title="Double-click to rename"
                        >
                            {folder?.name ?? 'Folder'}
                        </h1>
                    ) : (
                        <input
                            className="text-lg font-medium bg-transparent outline-none text-center w-full max-w-xs"
                            value={folderNameDraft}
                            onChange={(e) =>
                                setFolderNameDraft(e.currentTarget.value)
                            }
                            onBlur={async () => {
                                await renameFolder(folderNameDraft);
                                setEditingFolder(false);
                            }}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    await renameFolder(folderNameDraft);
                                    setEditingFolder(false);
                                }
                                if (e.key === 'Escape') {
                                    setFolderNameDraft(
                                        folder?.name ?? 'Folder'
                                    );
                                    setEditingFolder(false);
                                }
                            }}
                            autoFocus
                        />
                    )}
                </div>

                <NamePopover
                    label="Create Page"
                    placeholder="Page title"
                    trigger={
                        <Button variant="outline" size="sm">
                            New Page
                        </Button>
                    }
                    onSubmit={async (name, close) => {
                        if (!name) return;
                        const id = crypto.randomUUID();
                        const now = Date.now();
                        await db.pages.add({
                            id,
                            folderId,
                            title: name,
                            createdAt: now,
                            updatedAt: now,
                        });
                        close();
                        onOpenPage(id);
                    }}
                />
            </div>

            {/* Pages list */}
            {pages.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-6 text-center">
                    No pages yet. Use{' '}
                    <span className="font-medium">New Page</span> to add one.
                </div>
            ) : (
                <div className="space-y-1">
                    {pages.map((p) => (
                        <InlineRenameRow
                            key={p.id}
                            label={p.title || 'Untitled'}
                            onOpen={() => onOpenPage(p.id)}
                            onRename={async (name) => {
                                await db.pages.update(p.id, {
                                    title: name,
                                    updatedAt: Date.now(),
                                });
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
