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
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
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
        // In production, CRA outputs to src/renderer/build. Our compiled main.js lives in dist/.
        // __dirname points to app.asar/dist, so go up one and into src/renderer/build.
        const prodIndex = path.join(__dirname, '../src/renderer/build/index.html');
        if (!fs.existsSync(prodIndex)) {
            console.error('Production index.html not found at', prodIndex);
        }
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
// Utility: run a PowerShell command and return stdout
function runPowerShell(command) {
    return new Promise((resolve, reject) => {
        // Use -NoProfile for speed and predictability
        (0, child_process_1.exec)(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`, { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                console.error('PowerShell error:', error, stderr);
                reject(error);
                return;
            }
            resolve(stdout.toString());
        });
    });
}
async function listOpticalDrivesWin() {
    if (process.platform !== 'win32')
        return [];
    try {
        const ps = `Get-Volume | Where-Object { $_.DriveType -eq 'CD-ROM' -and $_.DriveLetter } | Select-Object DriveLetter, FileSystemLabel | ConvertTo-Json -Compress`;
        const out = await runPowerShell(ps);
        if (!out)
            return [];
        let data;
        try {
            data = JSON.parse(out);
        }
        catch (_a) {
            return [];
        }
        const arr = Array.isArray(data) ? data : (data ? [data] : []);
        return arr.map((d) => ({
            letter: (d.DriveLetter || '').toString().toUpperCase(),
            label: (d.FileSystemLabel || '').toString()
        }));
    }
    catch (e) {
        console.error('Failed to list optical drives', e);
        return [];
    }
}
// Detect optical (CD/DVD) drives on Windows using PowerShell
electron_1.ipcMain.handle('list-optical-drives', async () => {
    return listOpticalDrivesWin();
});
// Prompt the user to choose a disc drive if multiple
electron_1.ipcMain.handle('choose-disc-drive', async () => {
    const safeDrives = await listOpticalDrivesWin();
    if (!mainWindow)
        return null;
    if (safeDrives.length === 0) {
        await electron_1.dialog.showMessageBox(mainWindow, { type: 'info', message: 'No disc drives detected', detail: 'Insert a DVD or CD and try again.' });
        return null;
    }
    if (safeDrives.length === 1) {
        return `${safeDrives[0].letter}:/`;
    }
    const buttons = safeDrives.map(d => `${d.letter}:/ ${d.label || 'Disc'}`);
    const result = await electron_1.dialog.showMessageBox(mainWindow, {
        type: 'question',
        message: 'Choose a disc drive',
        buttons,
        cancelId: -1,
        noLink: true
    });
    const idx = result.response;
    if (idx < 0 || idx >= safeDrives.length)
        return null;
    return `${safeDrives[idx].letter}:/`;
});
// Scan a disc for playable content or DVD-Video structure
electron_1.ipcMain.handle('scan-disc', async (event, driveRoot) => {
    try {
        if (!driveRoot)
            return { kind: 'none' };
        const root = driveRoot.replace(/\\/g, '/');
        const normalized = /:\/$/.test(root) ? root : (root.endsWith('/') ? root : root + '/');
        const videoTs = path.join(normalized, 'VIDEO_TS');
        const supportedExt = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'];
        if (fs.existsSync(videoTs) && fs.statSync(videoTs).isDirectory()) {
            // DVD-Video detected; select VTS with largest total size
            const files = fs.readdirSync(videoTs).filter(f => /\.VOB$/i.test(f));
            const groups = {};
            for (const f of files) {
                const m = f.match(/^(VTS_\d{2})_\d+\.VOB$/i);
                if (!m)
                    continue;
                const key = m[1].toUpperCase();
                const full = path.join(videoTs, f);
                let size = 0;
                try {
                    size = fs.statSync(full).size;
                }
                catch (_a) { }
                if (!groups[key])
                    groups[key] = { total: 0, parts: [] };
                groups[key].total += size;
                groups[key].parts.push(full);
            }
            const best = Object.entries(groups).sort((a, b) => b[1].total - a[1].total)[0];
            if (best && best[1].parts.length) {
                const vobs = best[1].parts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                return { kind: 'dvd', vobs };
            }
            return { kind: 'dvd', vobs: [] };
        }
        // Otherwise, treat as data disc; scan up to depth 3
        const results = [];
        const thumbsDir = path.join(electron_1.app.getPath('userData'), 'thumbnails');
        try {
            fs.mkdirSync(thumbsDir, { recursive: true });
        }
        catch (_b) { }
        const scan = (dir, depth) => {
            if (depth > 3)
                return;
            let entries = [];
            try {
                entries = fs.readdirSync(dir);
            }
            catch (_a) {
                return;
            }
            for (const name of entries) {
                const p = path.join(dir, name);
                let st = null;
                try {
                    st = fs.statSync(p);
                }
                catch (_b) {
                    continue;
                }
                if (st.isDirectory()) {
                    scan(p, depth + 1);
                }
                else {
                    const ext = path.extname(name).toLowerCase();
                    if (supportedExt.includes(ext)) {
                        const thumbnailPath = path.join(thumbsDir, path.basename(name, ext) + '.jpg');
                        results.push({ path: p, thumbnail: thumbnailPath });
                    }
                }
            }
        };
        scan(normalized, 0);
        return { kind: 'data', videos: results };
    }
    catch (e) {
        console.error('scan-disc error', e);
        return { kind: 'none', error: String(e) };
    }
});
// Convert a DVD title (list of VOB files) to an MP4 we can play (H.264/AAC)
electron_1.ipcMain.handle('convert-dvd-title', async (event, vobPaths) => {
    if (!Array.isArray(vobPaths) || vobPaths.length === 0)
        return null;
    try {
        const cacheDir = path.join(electron_1.app.getPath('userData'), 'dvd-cache');
        try {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        catch (_a) { }
        const listFile = path.join(cacheDir, `concat-${Date.now()}.txt`);
        const outFile = path.join(cacheDir, `dvd-${Date.now()}.mp4`);
        // Write concat list
        const listContent = vobPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join(os.EOL);
        fs.writeFileSync(listFile, listContent, 'utf8');
        // Use fluent-ffmpeg to run the conversion
        const result = await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)()
                .input(listFile)
                .inputFormat('concat')
                .inputOptions(['-safe 0'])
                .outputOptions([
                '-map 0:v:0',
                '-map 0:a:0?',
                '-c:v libx264',
                '-preset veryfast',
                '-crf 22',
                '-c:a aac',
                '-b:a 192k',
                '-movflags +faststart'
            ])
                .on('start', cmd => console.log('FFmpeg start:', cmd))
                .on('error', (err) => {
                console.error('FFmpeg error:', err);
                resolve('');
            })
                .on('end', () => {
                console.log('FFmpeg finished:', outFile);
                resolve(outFile);
            })
                .save(outFile);
        });
        try {
            fs.unlinkSync(listFile);
        }
        catch (_b) { }
        return result || null;
    }
    catch (e) {
        console.error('convert-dvd-title error', e);
        return null;
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
                // First get video duration to calculate 50% point
                fluent_ffmpeg_1.default.ffprobe(video.path, (err, metadata) => {
                    var _a;
                    if (err) {
                        console.error('Error getting video metadata:', err);
                        resolve(false);
                        return;
                    }
                    const duration = ((_a = metadata.format) === null || _a === void 0 ? void 0 : _a.duration) || 0;
                    const midPoint = Math.floor(duration / 2); // 50% of video duration
                    const timemarkSeconds = midPoint > 0 ? midPoint : 20; // Fallback to 1 second if duration can't be determined
                    (0, fluent_ffmpeg_1.default)(video.path)
                        .screenshots({
                        count: 1,
                        folder: path.dirname(video.thumbnail),
                        filename: path.basename(video.thumbnail),
                        timemarks: [timemarkSeconds.toString()],
                        size: '320x180'
                    })
                        .on('end', () => {
                        console.log('Thumbnail generated for', path.basename(video.path), `at ${timemarkSeconds}s (50% of ${duration}s)`);
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
