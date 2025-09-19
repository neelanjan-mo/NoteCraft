// src/popup/popup.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';

export default function Popup() {
    const [text, setText] = useState('');

    async function save() {
        const value = text.trim();
        if (!value) return;

        const now = Date.now();
        let inbox = await db.pages.where({ title: 'Inbox' }).first();

        if (!inbox) {
            const id = crypto.randomUUID();
            inbox = {
                id,
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
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: value }],
                    },
                ],
            },
            order: now,
            updatedAt: now,
        });

        await db.pages.update(inbox.id, { updatedAt: now });
        setText('');
    }

    return (
        <div className="p-3 w-[340px]">
            <textarea
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder="Quick note…"
                className="w-full min-h-[96px] bg-transparent border border-input rounded-md p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
            <div className="mt-2 flex justify-end">
                <Button variant="outline" onClick={save}>
                    Save to Inbox
                </Button>
            </div>
        </div>
    );
}
