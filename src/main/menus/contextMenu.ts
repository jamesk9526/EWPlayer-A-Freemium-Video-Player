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
