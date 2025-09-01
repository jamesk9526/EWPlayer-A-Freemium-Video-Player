Here’s a crisp plan + drop-in TypeScript snippets to add a Tools submenu to your context menu that opens a Multi-Player popup window where you can search the library and “Add to player”.

UX flow (quick)

Right-click anywhere on a video item (or empty space) → Tools → Open Multi-Player…

A new popup window opens: a split layout with Library Search on the left and a Player Grid (2×2 by default) on the right.

Click any player tile to make it “active”, then either:

use the left-side search results and hit Add to Active, or

click Add to Player on a tile to open a quick search modal just for that tile.

Each tile loads and controls its own <video> independently.

Main process (Electron)
1) Register a context menu with a Tools submenu
// main/contextMenu.ts
import { BrowserWindow, Menu, ipcMain } from 'electron';

export function registerContextMenu(mainWindow: BrowserWindow, createMultiPlayerWindow: (payload?: { initialVideoId?: string }) => void) {
  ipcMain.handle('ui:show-tools-menu', async (_evt, payload?: { videoId?: string }) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Open Multi-Player…',
            accelerator: 'CmdOrCtrl+Shift+M',
            click: () => createMultiPlayerWindow(payload?.videoId ? { initialVideoId: payload.videoId } : undefined),
          },
        ],
      },
    ]);
    // Show at cursor in the focused window
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    if (win) menu.popup({ window: win });
  });
}

2) Create the Multi-Player popup window
// main/multiPlayerWindow.ts
import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'node:path';

let multiPlayerWin: BrowserWindow | null = null;

export function createMultiPlayerWindow(payload?: { initialVideoId?: string }) {
  if (multiPlayerWin && !multiPlayerWin.isDestroyed()) {
    multiPlayerWin.focus();
    if (payload?.initialVideoId) {
      multiPlayerWin.webContents.send('multi:add-initial', payload.initialVideoId);
    }
    return;
  }

  multiPlayerWin = new BrowserWindow({
    width: 1280,
    height: 840,
    title: 'Multi-Player',
    show: false,
    vibrancy: 'sidebar',
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // If you use React Router, point to a route like #/multi-player
  const url = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#/multi-player`
    : `file://${path.join(__dirname, '../renderer/index.html')}#/multi-player`;

  multiPlayerWin.loadURL(url);

  multiPlayerWin.once('ready-to-show', () => {
    multiPlayerWin?.show();
    if (payload?.initialVideoId) {
      multiPlayerWin?.webContents.send('multi:add-initial', payload.initialVideoId);
    }
  });

  multiPlayerWin.on('closed', () => (multiPlayerWin = null));
}

// (optional) handle window-level search in main if your library lives here
ipcMain.handle('library:search', async (_evt, q: string) => {
  // TODO: replace with your real library search
  // return await myLibrary.search(q)
  return []; // stub
});

3) Hook these up in main.ts
// main.ts
import { app, BrowserWindow } from 'electron';
import { registerContextMenu } from './contextMenu';
import { createMultiPlayerWindow } from './multiPlayerWindow';
import './preload'; // ensure preload is built

let mainWindow: BrowserWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({ /* ...your opts... */ });
  // load your main UI...

  registerContextMenu(mainWindow, (payload) => createMultiPlayerWindow(payload));
}

app.whenReady().then(createMainWindow);

Preload (IPC bridge)
// main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  showToolsMenu: (payload?: { videoId?: string }) => ipcRenderer.invoke('ui:show-tools-menu', payload),
  // Optional: if main handles search
  searchLibrary: (q: string) => ipcRenderer.invoke('library:search', q),

  // initial add
  onMultiInitial: (cb: (videoId: string) => void) => {
    const handler = (_: unknown, vid: string) => cb(vid);
    ipcRenderer.on('multi:add-initial', handler);
    return () => ipcRenderer.removeListener('multi:add-initial', handler);
  },
});


Type definition you can add for ergonomics:

// renderer/types/global.d.ts
export {};

declare global {
  interface Window {
    api: {
      showToolsMenu(payload?: { videoId?: string }): Promise<void>;
      searchLibrary?(q: string): Promise<Array<{ id: string; title: string; url: string }>>;
      onMultiInitial(cb: (videoId: string) => void): () => void;
    };
  }
}

Renderer: fire the context menu

Wherever you render library items, on right-click:

// renderer/components/VideoCard.tsx
type Props = { id: string; title: string; thumbnail: string; /* ... */ };

export function VideoCard({ id, title, thumbnail }: Props) {
  return (
    <div
      className="video-card"
      onContextMenu={(e) => {
        e.preventDefault();
        window.api.showToolsMenu({ videoId: id });
      }}
    >
      <img src={thumbnail} alt={title} />
      <div className="title">{title}</div>
    </div>
  );
}


You can also attach onContextMenu to the grid container to allow opening the Multi-Player even if no card is targeted (pass no videoId).

Multi-Player popup (React)

A minimal, production-leaning implementation:

// renderer/routes/MultiPlayer.tsx
import { useEffect, useMemo, useState } from 'react';

type MediaItem = { id: string; title: string; url: string };
type Slot = { id: number; media?: MediaItem };

const mockLibrary: MediaItem[] = [
  { id: '1', title: 'Sample 1', url: 'file:///path/to/sample1.mp4' },
  { id: '2', title: 'Sample 2', url: 'file:///path/to/sample2.mp4' },
  // Replace with real data
];

export default function MultiPlayer() {
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: 4 }, (_, i) => ({ id: i })));
  const [active, setActive] = useState<number>(0);
  const [q, setQ] = useState('');
  const [quickFor, setQuickFor] = useState<number | null>(null);

  // If you wired search to main via IPC, replace with await window.api.searchLibrary(q)
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return mockLibrary;
    return mockLibrary.filter((m) => m.title.toLowerCase().includes(qq));
  }, [q]);

  // If a videoId is passed when opening the window, slot 0 loads it
  useEffect(() => {
    const off = window.api.onMultiInitial((videoId) => {
      const found = mockLibrary.find((m) => m.id === videoId);
      if (found) setSlots((prev) => prev.map((s, i) => (i === 0 ? { ...s, media: found } : s)));
    });
    return off;
  }, []);

  function setSlotMedia(slotIndex: number, media: MediaItem) {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? { ...s, media } : s)));
  }

  return (
    <div className="h-screen w-screen text-gray-100 bg-neutral-900 grid grid-cols-[360px_1fr]">
      {/* Left: Search */}
      <aside className="border-r border-neutral-800 p-4 space-y-3">
        <div className="text-xl font-semibold">Library</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos…"
          className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none"
        />
        <div className="text-sm text-neutral-400">Active slot: {active + 1}</div>

        <div className="mt-2 space-y-2 overflow-auto max-h-[calc(100vh-170px)] pr-1">
          {results.map((m) => (
            <div key={m.id} className="rounded-lg bg-neutral-800 p-3 hover:bg-neutral-700 transition">
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-neutral-400">{m.url}</div>
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500"
                  onClick={() => setSlotMedia(active, m)}
                >
                  Add to Active
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right: Player Grid */}
      <main className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xl font-semibold">Multi-Player</div>
          <div className="text-sm text-neutral-400">Click a tile to select; each has its own controls.</div>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              className={[
                'relative rounded-xl overflow-hidden bg-neutral-800 border',
                active === i ? 'border-blue-500' : 'border-neutral-800',
              ].join(' ')}
              onClick={() => setActive(i)}
            >
              {!slot.media ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="text-neutral-400">No media</div>
                  <button
                    className="px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickFor(i);
                    }}
                  >
                    Add to Player
                  </button>
                </div>
              ) : (
                <video
                  src={slot.media.url}
                  className="w-full h-full object-contain bg-black"
                  controls
                  preload="metadata"
                />
              )}
              {/* Slot header */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded bg-black/50">
                  Slot {i + 1} {slot.media ? `• ${slot.media.title}` : ''}
                </span>
                {slot.media && (
                  <button
                    className="px-2 py-1 rounded bg-black/50 hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, media: undefined } : s)));
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Quick Search Modal */}
      {quickFor !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center"
          onClick={() => setQuickFor(null)}
        >
          <div
            className="w-[680px] max-w-[90vw] rounded-2xl bg-neutral-900 border border-neutral-800 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-3">Add to Player {quickFor + 1}</div>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search videos…"
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none"
            />
            <div className="mt-3 max-h-[50vh] overflow-auto space-y-2">
              {results.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-neutral-800 p-3">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-neutral-400">{m.url}</div>
                  </div>
                  <button
                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500"
                    onClick={() => {
                      setSlotMedia(quickFor, m);
                      setQuickFor(null);
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button className="px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600" onClick={() => setQuickFor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

“Give this to Copilot” – implementation checklist

Context menu

Create registerContextMenu(mainWindow, createMultiPlayerWindow) and call it from main.ts.

Add submenu Tools → Open Multi-Player…. Accelerator CmdOrCtrl+Shift+M.

Implement ipcMain.handle('ui:show-tools-menu', …) and call it from renderer window.api.showToolsMenu({ videoId }).

Popup window

Implement createMultiPlayerWindow(payload?) that loads #/multi-player.

On ready-to-show, call webContents.send('multi:add-initial', videoId) if provided.

Preload / typings

Expose showToolsMenu, optional searchLibrary, and onMultiInitial in preload.ts.

Add global.d.ts so TS recognizes window.api.

Renderer

On right-click of a VideoCard, call window.api.showToolsMenu({ videoId }).

Add a route/component MultiPlayer.tsx using a 2×2 grid, left-pane search, and per-slot Add to Player modal.

Library integration

Replace mockLibrary with your real source:

If your library is in the main process (filesystem, DB), wire ipcMain.handle('library:search') and call window.api.searchLibrary(q).

If your library is already in the renderer (indexed JSON, SQLite via WASM), keep it local.

Quality of life

Persist active layout to localStorage (slot count, last files).

Add keyboard shortcuts: 1..4 to select slot, Space to toggle play/pause on active.

Add “Change grid (1×2, 2×2, 3×3)” control if needed.

Guard multiple decoders: warn if opening more than 2–4 4K streams on low-end GPUs.