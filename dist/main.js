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
function createWindow() {
    const isDev = process.env.NODE_ENV === 'development';
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Remove native title bar
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // Allow loading file:/// thumbnails while renderer uses http://localhost in dev
            webSecurity: !isDev,
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/build/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
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
electron_1.ipcMain.handle('select-directory', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});
electron_1.ipcMain.handle('scan-videos', async (event, dirPath) => {
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
                        videos.push({ path: filePath, thumbnail: thumbnailPath });
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
    // Generate thumbnails synchronously for better UX
    for (const video of videos) {
        try {
            await new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(video.path)
                    .screenshots({
                    count: 1,
                    folder: path.dirname(video.thumbnail),
                    filename: path.basename(video.thumbnail),
                    timemarks: ['1'],
                    size: '320x180'
                })
                    .on('end', () => {
                    console.log('Thumbnail generated for', path.basename(video.path));
                    resolve(true);
                })
                    .on('error', (err) => {
                    console.error('Error generating thumbnail:', err);
                    resolve(false); // Don't fail the whole process
                });
            });
        }
        catch (error) {
            console.error('Thumbnail generation failed for:', video.path);
        }
    }
    return videos;
});
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
