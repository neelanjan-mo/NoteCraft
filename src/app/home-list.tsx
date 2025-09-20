// src/app/home-list.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Folder, Page } from '@/db/db';
import { InlineRenameRow } from '@/components/inline-rename-row';

export function HomeList({
    onOpenFolder,
    onOpenPage,
}: {
    onOpenFolder: (id: string) => void;
    onOpenPage: (id: string) => void;
}) {
    const folders =
        useLiveQuery<Folder[]>(
            () => db.folders.orderBy('sort').toArray(),
            []
        ) ?? [];

    const pages =
        useLiveQuery<Page[]>(async () => {
            const all = await db.pages.toArray();
            return all
                .filter((p) => p.folderId == null)
                .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
        }, []) ?? [];

    return (
        <div className="grid grid-cols-2 gap-6 p-3 pb-20 max-w-screen-lg mx-auto">
            {/* Folders */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold">Folders</h2>
                    <span className="text-xs text-muted-foreground">
                        {folders.length}
                    </span>
                </div>

                {folders.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-2 py-6 border rounded-md">
                        No folders yet. Use{' '}
                        <span className="font-medium">New Folder</span> below.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {folders.map((f) => (
                            <InlineRenameRow
                                key={f.id}
                                label={f.name}
                                onOpen={() => onOpenFolder(f.id)}
                                onRename={async (name: string) => {
                                    await db.folders.update(f.id, {
                                        name,
                                        updatedAt: Date.now(),
                                    });
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Root pages */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold">Pages</h2>
                    <span className="text-xs text-muted-foreground">
                        {pages.length}
                    </span>
                </div>

                {pages.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-2 py-6 border rounded-md">
                        No pages yet. Use{' '}
                        <span className="font-medium">New Page</span> below.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {pages.map((p) => (
                            <InlineRenameRow
                                key={p.id}
                                label={p.title || 'Untitled'}
                                onOpen={() => onOpenPage(p.id)}
                                onRename={async (name: string) => {
                                    await db.pages.update(p.id, {
                                        title: name,
                                        updatedAt: Date.now(),
                                    });
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
