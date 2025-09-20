// src/app/bottom-bar.tsx  (popup-only)
import { Button } from '@/components/ui/button';
import { NamePopover } from '@/components/name-popover';
import { db } from '@/db/db';

export function BottomBar({
    onNavigateFolder,
    onNavigatePage,
}: {
    onNavigateFolder: (id: string) => void;
    onNavigatePage: (id: string) => void;
}) {
    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-screen-lg flex items-center justify-between px-3 py-2">
                <div className="font-medium">NoteCraft</div>
                <div className="flex gap-2">
                    <NamePopover
                        label="Create Folder"
                        placeholder="Folder name"
                        trigger={<Button variant="outline">New Folder</Button>}
                        onSubmit={async (name, close) => {
                            if (!name) return;
                            const id = crypto.randomUUID();
                            const now = Date.now();
                            await db.folders.add({
                                id,
                                parentId: null,
                                name,
                                createdAt: now,
                                updatedAt: now,
                                sort: now,
                            });
                            close();
                            onNavigateFolder(id);
                        }}
                    />
                    <NamePopover
                        label="Create Page"
                        placeholder="Page title"
                        trigger={<Button variant="outline">New Page</Button>}
                        onSubmit={async (name, close) => {
                            if (!name) return;
                            const id = crypto.randomUUID();
                            const now = Date.now();
                            await db.pages.add({
                                id,
                                folderId: null,
                                title: name,
                                createdAt: now,
                                updatedAt: now,
                            });
                            close();
                            onNavigatePage(id);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
