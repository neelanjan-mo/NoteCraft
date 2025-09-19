// src/db/search.ts
import { db } from '@/db/db';
import type { Page } from '@/db/db';

export async function searchByTitle(q: string): Promise<Page[]> {
    const query = q.trim().toLowerCase();
    if (!query)
        return db.pages.orderBy('updatedAt').reverse().limit(20).toArray();
    return db.pages
        .filter((p) => p.title.toLowerCase().includes(query))
        .limit(20)
        .toArray();
}
