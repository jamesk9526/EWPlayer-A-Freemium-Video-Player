"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const mainWindow_1 = require("./windows/mainWindow");
require("./ipc/discHandlers");
require("./ipc/videoHandlers");
require("./ipc/settingsHandlers");
require("./ipc/windowHandlers");
electron_1.app.on('ready', mainWindow_1.createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        (0, mainWindow_1.createWindow)();
    }
});
