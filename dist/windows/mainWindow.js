"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWindow = createWindow;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const contextMenu_1 = require("../menus/contextMenu");
const multiPlayerWindow_1 = require("./multiPlayerWindow");
let mainWindow = null;
let fileToOpen = null;
// Handle file associations and command line arguments
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, focus our window instead
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
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
function createWindow() {
    const isDev = process.env.NODE_ENV === 'development';
    mainWindow = new electron_1.BrowserWindow({
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
    const contextMenu = electron_1.Menu.buildFromTemplate([
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { type: 'separator' },
        { label: 'Select All', role: 'selectAll' },
        { type: 'separator' },
        {
            label: 'Open with EwPlayer',
            click: () => {
                electron_1.shell.openPath(electron_1.app.getPath('exe'));
            }
        }
    ]);
    // Show context menu on right click
    mainWindow.webContents.on('context-menu', (event, params) => {
        contextMenu.popup();
    });
    // Register custom Tools submenu for Multi-Player
    (0, contextMenu_1.registerContextMenu)(mainWindow, (payload) => (0, multiPlayerWindow_1.createMultiPlayerWindow)(payload));
    // Handle F12 to open developer tools
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' && !input.control && !input.alt && !input.meta && !input.shift) {
            console.log('F12 pressed in main window - opening dev tools');
            event.preventDefault();
            mainWindow.webContents.toggleDevTools();
        }
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    }
    else {
        // In production, load from the packaged renderer build
        const prodIndex = path.join(__dirname, '../../src/renderer/build/index.html');
        mainWindow.loadFile(prodIndex);
    }
    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // If a file was specified to open, send it to renderer
        if (fileToOpen) {
            mainWindow.webContents.send('open-file', fileToOpen);
            fileToOpen = null;
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Handle window state changes for Windows integration
    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window-state-changed', 'maximized');
    });
    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window-state-changed', 'windowed');
    });
    return mainWindow;
}
