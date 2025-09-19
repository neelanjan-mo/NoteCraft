// src/db/dao.ts
import { db } from './db';
import type { Page } from './db';

export async function createFolder(
    name: string,
    parentId: string | null = null
): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    await db.folders.add({
        id,
        parentId,
        name,
        createdAt: now,
        updatedAt: now,
        sort: now,
    });
    return id;
}

export async function renameFolder(id: string, name: string): Promise<void> {
    await db.folders.update(id, { name, updatedAt: Date.now() });
}

export async function deleteFolder(id: string): Promise<void> {
    // cascade: delete pages + blocks within this folder (no nesting for MVP)
    const pages = await db.pages.where({ folderId: id }).toArray();
    await db.transaction('rw', db.folders, db.pages, db.blocks, async () => {
        for (const p of pages) await db.blocks.where({ pageId: p.id }).delete();
        await db.pages.where({ folderId: id }).delete();
        await db.folders.delete(id);
    });
}

export async function createPage(
    title: string,
    folderId: string | null = null
): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    await db.pages.add({ id, folderId, title, createdAt: now, updatedAt: now });
    return id;
}

export async function renamePage(id: string, title: string): Promise<void> {
    await db.pages.update(id, { title, updatedAt: Date.now() });
}

export async function deletePage(id: string): Promise<void> {
    await db.transaction('rw', db.pages, db.blocks, async () => {
        await db.blocks.where({ pageId: id }).delete();
        await db.pages.delete(id);
    });
}

export async function searchPagesByTitle(q: string): Promise<Page[]> {
    // simple LIKE search (Dexie Table API)
    return db.pages
        .filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
        .toArray();
}
