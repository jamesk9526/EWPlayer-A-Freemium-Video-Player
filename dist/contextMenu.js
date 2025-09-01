"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerContextMenu = registerContextMenu;
const electron_1 = require("electron");
function registerContextMenu(mainWindow, createMultiPlayerWindow) {
    electron_1.ipcMain.handle('ui:show-tools-menu', async (_evt, payload) => {
        var _a;
        const menu = electron_1.Menu.buildFromTemplate([
            {
                label: 'Tools',
                submenu: [
                    {
                        label: 'Open Multi-Player…',
                        accelerator: 'CmdOrCtrl+Shift+M',
                        click: () => createMultiPlayerWindow((payload === null || payload === void 0 ? void 0 : payload.videoId) ? { initialVideoId: payload.videoId } : undefined),
                    },
                ],
            },
        ]);
        // Show at cursor in the focused window
        const win = (_a = electron_1.BrowserWindow.getFocusedWindow()) !== null && _a !== void 0 ? _a : mainWindow;
        if (win)
            menu.popup({ window: win });
    });
}
