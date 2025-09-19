// src/background.ts
import browser from 'webextension-polyfill';

const MENU_ID = 'notecraft-clip-selection';

browser.runtime.onInstalled.addListener(async () => {
    // idempotent create
    try {
        await browser.contextMenus.create({
            id: MENU_ID,
            title: 'Save selection to NoteCraft',
            contexts: ['selection'],
        });
    } catch {
        // ignore duplicate create on reload
    }
});

browser.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== MENU_ID || !info.selectionText) return;
    // Broadcast to all extension pages; the options app will handle the write
    await browser.runtime.sendMessage({
        type: 'clip-selection',
        text: info.selectionText,
    });
});
