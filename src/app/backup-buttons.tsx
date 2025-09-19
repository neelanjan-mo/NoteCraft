// src/app/backup-buttons.tsx
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { exportVault, importVault } from '@/db/backup';

export function BackupButtons() {
    const fileRef = useRef<HTMLInputElement | null>(null);

    async function onExport() {
        const payload = await exportVault();
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notecraft-${new Date(payload.exportedAt).toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.currentTarget.files?.[0];
        if (!f) return;
        const json = JSON.parse(await f.text());
        await importVault(json);
        // Reset input so the same file can be re-imported if needed
        e.currentTarget.value = '';
    }

    return (
        <div className="ml-2 flex items-center gap-2">
            <Button variant="outline" onClick={onExport}>
                Export
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Import
            </Button>
            <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={onImport}
            />
        </div>
    );
}
