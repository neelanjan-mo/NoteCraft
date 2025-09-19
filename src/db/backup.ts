import { db } from './db';
import type { Folder, Page, Block } from './db';

export interface Vault {
    version: number;
    folders: Folder[];
    pages: Page[];
    blocks: Block[];
    exportedAt: number;
}

export async function exportVault(): Promise<Vault> {
    const [folders, pages, blocks] = await Promise.all([
        db.folders.toArray(),
        db.pages.toArray(),
        db.blocks.toArray(),
    ]);
    return { version: 1, folders, pages, blocks, exportedAt: Date.now() };
}

export async function importVault(vault: Vault): Promise<void> {
    await db.transaction('rw', db.folders, db.pages, db.blocks, async () => {
        await Promise.all([
            db.folders.clear(),
            db.pages.clear(),
            db.blocks.clear(),
        ]);
        await db.folders.bulkAdd(vault.folders);
        await db.pages.bulkAdd(vault.pages);
        await db.blocks.bulkAdd(vault.blocks);
    });
}
