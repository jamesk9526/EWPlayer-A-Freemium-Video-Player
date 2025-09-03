import { app, BrowserWindow } from 'electron';
import { createWindow } from './windows/mainWindow';
import './ipc/discHandlers';
import './ipc/videoHandlers';
import './ipc/settingsHandlers';
import './ipc/windowHandlers';

app.on('ready', createWindow);

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
