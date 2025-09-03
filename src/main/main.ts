import { app, BrowserWindow, globalShortcut, Menu, MenuItem } from 'electron';
import { createWindow } from './windows/mainWindow';
import './ipc/discHandlers';
import './ipc/videoHandlers';
import './ipc/settingsHandlers';
import './ipc/windowHandlers';

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
  mainWindow = createWindow();

  // Register F12 to open developer tools
  globalShortcut.register('F12', () => {
    console.log('F12 pressed');
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      console.log('Opening dev tools for focused window');
      focusedWindow.webContents.openDevTools();
    } else {
      console.log('No focused window found');
      // Fallback to main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('Opening dev tools for main window');
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Also add to application menu for easier access
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const viewMenu = menu.items.find(item => item.label === 'View');
    if (viewMenu && viewMenu.submenu) {
      (viewMenu.submenu as Menu).append(new MenuItem({
        label: 'Toggle Developer Tools',
        accelerator: 'F12',
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
          } else if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.toggleDevTools();
          }
        }
      }));
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
});
