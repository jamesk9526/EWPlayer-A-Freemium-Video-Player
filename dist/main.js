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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
else {
    console.warn('ffmpeg-static not found; relying on system ffmpeg in PATH');
}
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
            const filePath = commandLine.find(arg => arg.endsWith('.mp4') || arg.endsWith('.avi') ||
                arg.endsWith('.mkv') || arg.endsWith('.mov') || arg.endsWith('.wmv') || arg.endsWith('.flv'));
            if (filePath && fs.existsSync(filePath)) {
                mainWindow.webContents.send('open-file', filePath);
            }
        }
    });
    // Handle file opened from command line on first instance
    const filePath = process.argv.find(arg => arg.endsWith('.mp4') || arg.endsWith('.avi') ||
        arg.endsWith('.mkv') || arg.endsWith('.mov') || arg.endsWith('.wmv') || arg.endsWith('.flv'));
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
        icon: path.join(__dirname, '../../assets/icon.ico'), // Windows icon
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // Allow loading file:/// thumbnails while renderer uses http://localhost in dev
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
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/build/index.html'));
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
}
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC Handlers
electron_1.ipcMain.handle('select-directory', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});
electron_1.ipcMain.handle('open-file-dialog', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            {
                name: 'Video Files',
                extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv']
            }
        ]
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});
electron_1.ipcMain.handle('show-in-explorer', async (event, filePath) => {
    electron_1.shell.showItemInFolder(filePath);
});
electron_1.ipcMain.handle('get-file-info', async (event, filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return {
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
        };
    }
    catch (error) {
        console.error('Error getting file info:', error);
        return null;
    }
});
electron_1.ipcMain.handle('scan-videos', async (event, dirPath, thumbnailPosition = 50) => {
    const videos = [];
    function scanDir(dir) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    scanDir(filePath);
                }
                else {
                    const ext = path.extname(file).toLowerCase();
                    if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'].includes(ext)) {
                        const thumbsDir = path.join(electron_1.app.getPath('userData'), 'thumbnails');
                        try {
                            fs.mkdirSync(thumbsDir, { recursive: true });
                        }
                        catch (_a) { }
                        const thumbnailPath = path.join(thumbsDir, path.basename(file, ext) + '.jpg');
                        videos.push({
                            path: filePath,
                            thumbnail: thumbnailPath,
                            stats: {
                                size: stat.size
                            }
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error scanning directory:', error);
        }
    }
    scanDir(dirPath);
    console.log('Found videos:', videos.length);
    // Generate thumbnails and get metadata
    for (const video of videos) {
        try {
            // Get video metadata first
            video.metadata = await getVideoMetadata(video.path);
            await new Promise((resolve, reject) => {
                // First get video duration to calculate thumbnail position
                fluent_ffmpeg_1.default.ffprobe(video.path, (err, metadata) => {
                    var _a;
                    if (err) {
                        console.error('Error getting video metadata:', err);
                        resolve(false);
                        return;
                    }
                    const duration = ((_a = metadata.format) === null || _a === void 0 ? void 0 : _a.duration) || 0;
                    const thumbnailTime = Math.floor(duration * (thumbnailPosition / 100));
                    const timemarkSeconds = thumbnailTime > 0 ? thumbnailTime : 20;
                    (0, fluent_ffmpeg_1.default)(video.path)
                        .screenshots({
                        count: 1,
                        folder: path.dirname(video.thumbnail),
                        filename: path.basename(video.thumbnail),
                        timemarks: [timemarkSeconds.toString()],
                        size: '320x180'
                    })
                        .on('end', () => {
                        console.log('Thumbnail generated for', path.basename(video.path), `at ${timemarkSeconds}s (${thumbnailPosition}% of ${duration}s)`);
                        resolve(true);
                    })
                        .on('error', (err) => {
                        console.error('Error generating thumbnail:', err);
                        resolve(false); // Don't fail the whole process
                    });
                });
            });
        }
        catch (error) {
            console.error('Thumbnail generation failed for:', video.path);
        }
    }
    return videos;
});
// Get video metadata using ffprobe
async function getVideoMetadata(videoPath) {
    return new Promise((resolve) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                console.error('Error getting metadata:', err);
                resolve({});
                return;
            }
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            const duration = metadata.format.duration || 0;
            const result = {
                duration: duration,
                resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : undefined,
                bitrate: metadata.format.bit_rate ? Math.round(Number(metadata.format.bit_rate) / 1000) : undefined,
                codec: videoStream === null || videoStream === void 0 ? void 0 : videoStream.codec_name
            };
            resolve(result);
        });
    });
}
electron_1.ipcMain.handle('delete-video', async (event, videoPath) => {
    try {
        fs.unlinkSync(videoPath);
        return true;
    }
    catch (error) {
        console.error('Error deleting video:', error);
        return false;
    }
});
// Window control handlers
electron_1.ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});
electron_1.ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow.maximize();
        }
    }
});
electron_1.ipcMain.handle('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});
// Enhanced window features
electron_1.ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        return mainWindow.isFullScreen();
    }
    return false;
});
electron_1.ipcMain.handle('set-always-on-top', (event, flag) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(flag);
        return mainWindow.isAlwaysOnTop();
    }
    return false;
});
