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
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // If you use React Router, point to a route like #/multi-player
  const url = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#/multi-player`
    : `file://${path.join(__dirname, '../../src/renderer/build/index.html')}#/multi-player`;

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
