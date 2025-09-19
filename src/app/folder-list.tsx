import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Folder, Page } from '@/db/db';

export function FolderList({
    folderId,
    onOpenPage,
    onBack,
}: {
    folderId: string;
    onOpenPage: (id: string) => void;
    onBack: () => void;
}) {
    // Two args only; add generics; coalesce.
    const folder = useLiveQuery<Folder | undefined>(
        () => db.folders.get(folderId),
        [folderId]
    );
    const pages =
        useLiveQuery<Page[]>(
            () => db.pages.where({ folderId }).toArray(),
            [folderId]
        ) ?? [];

    return (
        <div className="p-3 pb-20 max-w-screen-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
                <button
                    className="text-sm text-muted-foreground"
                    onClick={onBack}
                >
                    ← Back
                </button>
                <h1 className="text-lg font-medium">
                    {folder?.name ?? 'Folder'}
                </h1>
                <div />
            </div>

            <div className="space-y-1">
                {pages.map((p) => (
                    <button
                        key={p.id}
                        className="w-full text-left px-2 py-1 rounded hover:bg-accent"
                        onClick={() => onOpenPage(p.id)}
                    >
                        {p.title || 'Untitled'}
                    </button>
                ))}
            </div>
        </div>
    );
}
