import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Folder, Page } from '@/db/db';

export function HomeList({
    onOpenFolder,
    onOpenPage,
}: {
    onOpenFolder: (id: string) => void;
    onOpenPage: (id: string) => void;
}) {
    // 1) Two args only; add a generic and coalesce to [].
    const folders =
        useLiveQuery<Folder[]>(
            () => db.folders.orderBy('sort').toArray(),
            []
        ) ?? [];

    // 2) Root pages: cannot equals(null) on an index; scan + filter.
    const pages =
        useLiveQuery<Page[]>(
            () => db.pages.filter((p) => p.folderId == null).toArray(),
            []
        ) ?? [];

    return (
        <div className="grid grid-cols-2 gap-6 p-3 pb-20 max-w-screen-lg mx-auto">
            <section>
                <h2 className="text-sm font-semibold mb-2">Folders</h2>
                <div className="space-y-1">
                    {folders.map((f) => (
                        <button
                            key={f.id}
                            className="w-full text-left px-2 py-1 rounded hover:bg-accent"
                            onClick={() => onOpenFolder(f.id)}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-sm font-semibold mb-2">Pages</h2>
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
            </section>
        </div>
    );
}
