# 1) Executive summary

**Objective:** Ship an offline, cross-browser notes extension with a Notion-like editor, folders/pages, quick capture, and backup/restore.

**Tech stack:** MV3, React + Vite, CRXJS, TypeScript, Tailwind, shadcn-ui (Radix), TipTap, Dexie (IndexedDB), `webextension-polyfill`.

**Targets:** Chrome Web Store and Firefox AMO (Manifest V3). MV3 loading & AMO submission specifics referenced below. ([Chrome for Developers](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?utm_source=chatgpt.com))

---

# 2) Architecture and responsibilities

## 2.1 Surfaces

- **Popup (popup.html):** compact, focused workspace with bottom bar:
    - Quick Search
    - Create Folder/Page (popover prompt → persisted → navigate)
    - Home (folders & root pages) → Folder view → Page view (editor)
- **Options App (app.html):** full-page workspace mirroring popup data, without the fixed bottom bar.
- **Background (service worker):** install-time bootstrap + context-menu clipper (“Save selection to NoteCraft”) → message → app writes the block.

## 2.2 Data & persistence

- **Dexie + IndexedDB** for all data. Schema: `folders`, `pages`, `blocks`. Backup/restore uses `bulkAdd` inside a transaction for atomicity.
- **Search:** Dexie queries + simple title LIKE; quick search wired to jump to a page.
- **State:** Local React state + live Dexie queries (`dexie-react-hooks`).
- **Cross-browser API:** `webextension-polyfill` unifies `browser.*` / `chrome.*`. ([GitHub](https://github.com/mozilla/webextension-polyfill?utm_source=chatgpt.com))

## 2.3 Editor

- **TipTap** editor with `StarterKit`, Tasks, and controlled save (debounced JSON writes to `blocks` + `pages.updatedAt`). ([Tiptap](https://tiptap.dev/docs/editor/getting-started/install/react?utm_source=chatgpt.com))

## 2.4 UI components

- **shadcn-ui** (Radix Primitives) for inputs, buttons, and **Popover**. We implemented a `NamePopover` (folder/page naming) and an `InlineRenameRow` for in-list editing. ([Radix UI](https://www.radix-ui.com/primitives/docs/components/popover?utm_source=chatgpt.com))

---

# 3) Project layout

```
note-craft/
├─ manifest.json
├─ vite.config.ts
├─ public/                # static assets
├─ src/
│  ├─ main.tsx            # app.html mount
│  ├─ popup/
│  │  ├─ main.tsx         # popup.html mount
│  │  └─ popup.tsx        # popup root component
│  ├─ background.ts       # MV3 background (service worker)
│  ├─ db/
│  │  ├─ db.ts            # Dexie schema (folders/pages/blocks)
│  │  ├─ dao.ts           # CRUD & helpers
│  │  └─ backup.ts        # exportVault / importVault (tx)
│  ├─ app/
│  │  ├─ app-workspace.tsx    # options (tab) workspace
│  │  ├─ workspace.tsx        # merged workspace (if needed)
│  │  ├─ home-list.tsx        # list folders + root pages
│  │  ├─ folder-list.tsx      # folder pages + inline rename
│  │  ├─ page-view.tsx        # title + NoteEditor + save status
│  │  ├─ bottom-bar.tsx       # popup bottom navbar (create & nav)
│  │  ├─ quick-search.tsx     # search & jump
│  │  └─ runtime-listeners.ts # handle background messages
│  ├─ editor/
│  │  └─ note-editor.tsx      # TipTap editor wrapper
│  ├─ components/
│  │  ├─ ui/                  # shadcn Button, Input, Popover
│  │  ├─ name-popover.tsx     # reusable naming popover
│  │  └─ inline-rename-row.tsx
│  ├─ lib/
│  │  ├─ debounce.ts          # typed debounce
│  │  └─ utils.ts             # cn(), etc.
│  └─ index.css               # Tailwind + editor base styles
├─ app.html
└─ popup.html

```

---

# 4) Manifest & build tooling

## 4.1 `manifest.json` (MV3)

Key points:

- `"action": { "default_popup": "popup.html" }`
- `"options_ui": { "page": "app.html", "open_in_tab": true }`
- `"background": { "service_worker": "background.js", "type": "module" }`
- `"permissions": ["storage", "contextMenus"]`

**Why:** MV3 requires a service worker for background. Context menu requires `"contextMenus"`. Storage is for settings/quotas (most data is IndexedDB via Dexie). Chrome MV3 basics + “Load unpacked” flow here. ([Chrome for Developers](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?utm_source=chatgpt.com))

**Firefox nuance:** Firefox MV3 is supported but not identical to Chromium; AMO **requires an add-on ID** for MV3 submissions (set `browser_specific_settings.gecko.id`). See MV3 divergence + submission guidance. ([Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/?utm_source=chatgpt.com))

## 4.2 Vite + CRXJS

- **CRXJS plugin** compiles React/Vite into an extension, wiring HMR for dev and building a distributable for Chrome/Firefox. ([CRXJS](https://crxjs.dev/?utm_source=chatgpt.com))

`vite.config.ts` highlights:

- `crx({ manifest })`
- Alias: `@ → ./src`
- Tailwind plugin
- Dev server at `:3000` for easier iteration (CRXJS injects HMR to extension pages).

---

# 5) Data model & persistence

## 5.1 Dexie schema (`src/db/db.ts`)

- **Folder**: `id`, `parentId`, `name`, `createdAt`, `updatedAt`, `sort`
- **Page**: `id`, `folderId`, `title`, `createdAt`, `updatedAt`
- **Block**: `id`, `pageId`, `type`, `contentJSON`, `order`, `updatedAt`

Dexie table updates return `Promise<number>` (count of updated rows), which is why handlers `await db.pages.update(...)` and ignore the numeric result. ([Dexie](https://dexie.org/docs/Table/Table.update%28%29?utm_source=chatgpt.com))

**Migrations:** future schema changes implemented via `version(n).upgrade(...)`. ([Dexie](https://dexie.org/docs/Version/Version.upgrade%28%29?utm_source=chatgpt.com))

## 5.2 Backup & restore

- `exportVault`: read all tables concurrently; dump typed payload.
- `importVault`: wrap `clear + bulkAdd` for each table in a **single RW transaction** for atomic restores (Dexie transaction semantics). ([Dexie](https://dexie.org/docs/Collection/Collection.modify%28%29?utm_source=chatgpt.com))

---

# 6) Core UX flows implemented

## 6.1 Bottom bar (popup only)

- Two actions with **popovers**:
    - **New Folder** → prompt for name → `folders.add(...)` → navigate to Folder view
    - **New Page** → prompt for title → `pages.add(...)` → navigate to Page view
- Uses Radix **Popover** under shadcn wrappers; Trigger/Content/Root are standard. ([Radix UI](https://www.radix-ui.com/primitives/docs/components/popover?utm_source=chatgpt.com))

## 6.2 Home → Folder → Page navigation

- **Home:** lists folders and root pages; counts; inline rename on hover/double-click.
- **Folder view:** list pages in the folder + **inline folder rename** (double-click the title) and a **“New Page” popover**.
- **Page view:** title input + **TipTap editor**. Save indicator toggles via `onBeforeSave/onAfterSave`.

## 6.3 Inline rename control

- `InlineRenameRow`:
    - Hover affordance, double-click to edit, **Enter/Escape** handling.
    - Calls `db.folders.update` or `db.pages.update` and exits edit mode.

## 6.4 Quick Search

- Input that queries Dexie (case-insensitive title match), returns a list; Enter selects first; clicking results navigates to the matching page.

## 6.5 TipTap editor

- `useEditor` with `StarterKit`, `TaskList`, `TaskItem`. Initial content loads from the latest `block` for a page. `onUpdate` (debounced) writes JSON back to `blocks` and updates the page’s `updatedAt`. TipTap React integration and `StarterKit` reference docs here. ([Tiptap](https://tiptap.dev/docs/editor/getting-started/install/react?utm_source=chatgpt.com))

## 6.6 Context-menu clipper

- Background service worker registers a **selection** context menu on install, listens for clicks, then broadcasts a message to app pages, which upsert to an Inbox page.
- Implemented with `webextension-polyfill` (`browser.contextMenus.*`, `runtime.sendMessage`). MDN WebExtensions API reference. ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API?utm_source=chatgpt.com))

---

# 7) Developer workflow

## 7.1 Local setup

```bash
pnpm i
pnpm dev            # starts Vite + CRXJS for extension pages

```

**Chrome load (unpacked):**

1. `pnpm build` or use the dev output folder from CRXJS.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, point to CRXJS output dir (or `dist`). ([Chrome for Developers](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?utm_source=chatgpt.com))

**Firefox temporary load:**

- Go to `about:debugging` → “This Firefox” → **Load Temporary Add-on…** → select the built artifact (manifest in build dir). (AMO requires an ID for MV3 when you submit; for temporary loads you can still test locally.) ([Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/?utm_source=chatgpt.com))

## 7.2 Build

```bash
pnpm build
# CRXJS emits production extension artifacts per browser target.

```

CRXJS docs: getting started & plugin overview. ([CRXJS](https://crxjs.dev/?utm_source=chatgpt.com))

---

# 8) Cross-browser considerations

- **Unified API:** code imports `browser` from `webextension-polyfill`; works in Firefox natively and in Chrome via the polyfill. Types via `@types/webextension-polyfill`. ([GitHub](https://github.com/mozilla/webextension-polyfill?utm_source=chatgpt.com))
- **Firefox MV3:** feature parity differs from Chromium; consult Mozilla’s MV3 migration notes. ([Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/?utm_source=chatgpt.com))
- **AMO MV3 requirement:** include `browser_specific_settings.gecko.id` in `manifest.json` before submission. ([Stack Overflow](https://stackoverflow.com/questions/74683819/the-extension-id-is-required-in-manifest-version-3-and-above-firefox-error-in-m?utm_source=chatgpt.com))

---

# 9) Security, privacy, and performance

- **Data locality:** all notes are stored in IndexedDB; no network calls. (Declare in store listings.)
- **Backups:** explicit export/import (JSON). Consider encrypting export blobs in the future.
- **Permissions:** minimal (`storage`, `contextMenus`).
- **MV3 background:** event-driven worker; keep handlers short and message the UI; avoids long-running work.
- **Editor footprint:** TipTap renders only when page view is active; debounced saves to reduce write churn.

---

# 10) Store submission (Chrome + Firefox)

## 10.1 Chrome Web Store

- Build a production package via CRXJS, then upload through the **Chrome Web Store Developer Dashboard**. Provide:
    - Icons/screenshots, long & short descriptions, category, privacy disclosure (local-only).
    - MV3 manifest passes automated checks; ensure no remote code, no undefined host permissions.
- During review, Google enforces MV3; MV2 extensions are being disabled. Background context on MV3 rollout. ([The Verge](https://www.theverge.com/2024/10/15/24270981/google-chrome-ublock-origin-phaseout-manifest-v3-ad-blocker?utm_source=chatgpt.com))

## 10.2 Firefox AMO

- Create a signed XPI by uploading the built directory/zip to AMO’s **Submit a New Add-on**.
- Ensure your `manifest.json` has `browser_specific_settings.gecko.id`.
- Review AMO’s current submission guide and policy updates. ([Firefox Extension Workshop](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/?utm_source=chatgpt.com))

---

# 11) Key implementation snippets (indicative)

## 11.1 Dexie schema

```tsx
// db.ts
export interface Folder { id: string; parentId: string|null; name: string; createdAt: number; updatedAt: number; sort: number; }
export interface Page   { id: string; folderId: string|null; title: string; createdAt: number; updatedAt: number; }
export interface Block  { id: string; pageId: string; type: 'heading'|'paragraph'|'bullet_list'|'ordered_list'|'task_item'; contentJSON: unknown; order: number; updatedAt: number; }

```

## 11.2 Editor wiring

```tsx
// note-editor.tsx (excerpt)
const editor = useEditor({
  extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true })],
  content: initialJSON ?? { type: 'doc', content: [] },
  onUpdate: ({ editor }) => save(editor.getJSON()),
});

```

(TipTap React + StarterKit references.) ([Tiptap](https://tiptap.dev/docs/editor/getting-started/install/react?utm_source=chatgpt.com))

## 11.3 Popover-based creation

```tsx
// bottom-bar.tsx (popup only)
<NamePopover label="Create Page" placeholder="Page title" onSubmit={async (name, close) => {
  const id = crypto.randomUUID(); const now = Date.now();
  await db.pages.add({ id, folderId: null, title: name, createdAt: now, updatedAt: now });
  close(); onNavigatePage(id);
}} />

```

(Radix Popover API basis.) ([Radix UI](https://www.radix-ui.com/primitives/docs/components/popover?utm_source=chatgpt.com))

## 11.4 Background context menu

```tsx
// background.ts
browser.runtime.onInstalled.addListener(async () => {
  try { await browser.contextMenus.create({ id: 'notecraft-clip-selection', title: 'Save selection to NoteCraft', contexts: ['selection'] }); } catch {}
});
browser.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'notecraft-clip-selection' || !info.selectionText) return;
  await browser.runtime.sendMessage({ type: 'clip-selection', text: info.selectionText });
});

```

(WebExtensions API reference.) ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API?utm_source=chatgpt.com))

---

# 12) Testing protocol

**Unit smoke:** create/rename folder, create/rename page, write in editor, quick search, backup/export/import round-trip.

**Chrome manual:**

1. `pnpm build`
2. `chrome://extensions` → Developer mode → Load unpacked → `dist`
3. Validate: popup opens; bottom bar popovers; context menu “Save selection” works. ([Chrome for Developers](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?utm_source=chatgpt.com))

**Firefox manual:**

- `about:debugging` → Load Temporary Add-on → built directory/zip → test popup and options app. Ensure MV3 features behave as expected; keep an eye on any API divergences. ([Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/?utm_source=chatgpt.com))

---