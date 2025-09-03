import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerContextMenu } from '../menus/contextMenu';
import { createMultiPlayerWindow } from './multiPlayerWindow';

let mainWindow: Electron.BrowserWindow | null = null;
let fileToOpen: string | null = null;

// Handle file associations and command line arguments
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Handle file opened from command line in second instance
      const filePath = commandLine.find(arg => arg.endsWith('.mp4') || arg.endsWith('.mkv') || 
        arg.endsWith('.mov') || arg.endsWith('.wmv') || arg.endsWith('.flv') || arg.endsWith('.m2ts'));
      if (filePath && fs.existsSync(filePath)) {
        mainWindow.webContents.send('open-file', filePath);
      }
    }
  });

  // Handle file opened from command line on first instance
  const filePath = process.argv.find(arg => arg.endsWith('.mp4') || arg.endsWith('.mkv') || 
    arg.endsWith('.mov') || arg.endsWith('.wmv') || arg.endsWith('.flv') || arg.endsWith('.m2ts'));
  if (filePath && fs.existsSync(filePath)) {
    fileToOpen = filePath;
  }
}

export function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove native title bar
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../../../assets/icon.ico'), // Windows icon
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !isDev,
    },
    show: false, // Don't show until ready
  });

  // Create native Windows context menu
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Cut', role: 'cut' },
    { label: 'Copy', role: 'copy' },
    { label: 'Paste', role: 'paste' },
    { type: 'separator' },
    { label: 'Select All', role: 'selectAll' },
    { type: 'separator' },
    { 
      label: 'Open with EwPlayer', 
      click: () => {
        shell.openPath(app.getPath('exe'));
      }
    }
  ]);

  // Show context menu on right click
  mainWindow.webContents.on('context-menu', (event, params) => {
    contextMenu.popup();
  });

  // Register custom Tools submenu for Multi-Player
  registerContextMenu(mainWindow, (payload?: { initialVideoId?: string }) => createMultiPlayerWindow(payload));

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load from the packaged renderer build
    const prodIndex = path.join(__dirname, '../../src/renderer/build/index.html');
    mainWindow.loadFile(prodIndex);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
    
    // If a file was specified to open, send it to renderer
    if (fileToOpen) {
      mainWindow!.webContents.send('open-file', fileToOpen);
      fileToOpen = null;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window state changes for Windows integration
  mainWindow.on('maximize', () => {
    mainWindow!.webContents.send('window-state-changed', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow!.webContents.send('window-state-changed', 'windowed');
  });

  return mainWindow;
}
