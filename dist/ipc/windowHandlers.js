"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Window control handlers
electron_1.ipcMain.handle('window-minimize', () => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (win) {
        win.minimize();
    }
});
electron_1.ipcMain.handle('window-maximize', () => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    }
});
electron_1.ipcMain.handle('window-close', () => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (win) {
        win.close();
    }
});
