// src/app/backup-actions.ts
import { exportVault, importVault } from '@/db/backup';

export async function downloadVault() {
    const payload = await exportVault();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notecraft-v${payload.version}-${new Date(payload.exportedAt).toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url); // MDN: clean up object URLs
}

export async function uploadVault(file: File) {
    const text = await file.text();
    const json = JSON.parse(text);
    await importVault(json);
}
