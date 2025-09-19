// src/app/runtime-listeners.ts
import browser from 'webextension-polyfill';
import { db } from '@/db/db';

async function saveToInbox(text: string) {
    const value = text.trim();
    if (!value) return;
    const now = Date.now();
    let inbox = await db.pages.where({ title: 'Inbox' }).first();
    if (!inbox) {
        inbox = {
            id: crypto.randomUUID(),
            folderId: null,
            title: 'Inbox',
            createdAt: now,
            updatedAt: now,
        };
        await db.pages.add(inbox);
    }
    await db.blocks.add({
        id: crypto.randomUUID(),
        pageId: inbox.id,
        type: 'paragraph',
        contentJSON: {
            type: 'doc',
            content: [
                { type: 'paragraph', content: [{ type: 'text', text: value }] },
            ],
        },
        order: now,
        updatedAt: now,
    });
    await db.pages.update(inbox.id, { updatedAt: now });
}

export function registerRuntimeHandlers() {
    const handler = async (msg: unknown) => {
        const m = msg as { type?: string; text?: string };
        if (m?.type === 'clip-selection' && m.text) {
            await saveToInbox(m.text);
        }
    };
    browser.runtime.onMessage.addListener(handler);
    return () => browser.runtime.onMessage.removeListener(handler);
}
