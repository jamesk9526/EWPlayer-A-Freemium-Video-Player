"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const mainWindow_1 = require("./windows/mainWindow");
require("./ipc/discHandlers");
require("./ipc/videoHandlers");
require("./ipc/settingsHandlers");
require("./ipc/windowHandlers");
let mainWindow = null;
electron_1.app.on('ready', () => {
    mainWindow = (0, mainWindow_1.createWindow)();
    // Register F12 to open developer tools
    electron_1.globalShortcut.register('F12', () => {
        console.log('F12 pressed');
        const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
        if (focusedWindow) {
            console.log('Opening dev tools for focused window');
            focusedWindow.webContents.openDevTools();
        }
        else {
            console.log('No focused window found');
            // Fallback to main window
            if (mainWindow && !mainWindow.isDestroyed()) {
                console.log('Opening dev tools for main window');
                mainWindow.webContents.openDevTools();
            }
        }
    });
    // Also add to application menu for easier access
    const menu = electron_1.Menu.getApplicationMenu();
    if (menu) {
        const viewMenu = menu.items.find(item => item.label === 'View');
        if (viewMenu && viewMenu.submenu) {
            viewMenu.submenu.append(new electron_1.MenuItem({
                label: 'Toggle Developer Tools',
                accelerator: 'F12',
                click: () => {
                    const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
                    if (focusedWindow) {
                        focusedWindow.webContents.toggleDevTools();
                    }
                    else if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            }));
        }
    }
});
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
electron_1.app.on('will-quit', () => {
    // Unregister all global shortcuts
    electron_1.globalShortcut.unregisterAll();
});
