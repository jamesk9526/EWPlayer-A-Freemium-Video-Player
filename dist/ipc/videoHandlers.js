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
    // Handle both development and production paths
    let ffmpegPath = ffmpeg_static_1.default;
    // In packaged app, ffmpeg-static is unpacked to .asar.unpacked
    if (electron_1.app.isPackaged) {
        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
        if (fs.existsSync(unpackedPath)) {
            ffmpegPath = unpackedPath;
        }
        else {
            // Fallback: try the original path (might work if asarUnpack worked differently)
            const asarPath = path.join(process.resourcesPath, 'app.asar', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
            if (fs.existsSync(asarPath)) {
                ffmpegPath = asarPath;
            }
        }
    }
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpegPath);
    console.log('FFmpeg path set to:', ffmpegPath);
}
else {
    console.warn('ffmpeg-static not found; relying on system ffmpeg in PATH');
}
electron_1.ipcMain.handle('select-directory', async () => {
    const result = await electron_1.dialog.showOpenDialog(electron_1.BrowserWindow.getFocusedWindow(), {
        properties: ['openDirectory']
    });
    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});
electron_1.ipcMain.handle('open-file-dialog', async () => {
    const result = await electron_1.dialog.showOpenDialog(electron_1.BrowserWindow.getFocusedWindow(), {
        properties: ['openFile'],
        filters: [
            {
                name: 'Video Files',
                extensions: ['mp4', 'mkv', 'mov', 'wmv', 'flv', 'm2ts']
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
electron_1.ipcMain.handle('scan-videos', async (event, dirPath, options) => {
    console.log('Main process: scan-videos called with dirPath:', dirPath);
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
        console.error('Directory does not exist:', dirPath);
        return [];
    }
    if (!fs.statSync(dirPath).isDirectory()) {
        console.error('Path is not a directory:', dirPath);
        return [];
    }
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
                    if (['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'].includes(ext)) {
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
    // Generate thumbnails with caching
    for (const video of videos) {
        try {
            // Check if thumbnail already exists and is recent (within 24 hours)
            const thumbnailExists = fs.existsSync(video.thumbnail);
            let needsGeneration = true;
            if (thumbnailExists) {
                const thumbnailStats = fs.statSync(video.thumbnail);
                const videoStats = fs.statSync(video.path);
                const thumbnailAge = Date.now() - thumbnailStats.mtime.getTime();
                const videoModified = videoStats.mtime.getTime();
                // Regenerate if thumbnail is older than video file or older than 7 days
                if (thumbnailStats.mtime.getTime() >= videoModified && thumbnailAge < 7 * 24 * 60 * 60 * 1000) {
                    needsGeneration = false;
                    console.log('Using cached thumbnail for', path.basename(video.path));
                }
            }
            if (needsGeneration) {
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
                        const thumbnailPercentage = (options === null || options === void 0 ? void 0 : options.thumbnailPercentage) || 50;
                        const thumbnailJitter = (options === null || options === void 0 ? void 0 : options.thumbnailJitter) || 0;
                        const percentagePoint = Math.floor((duration * thumbnailPercentage) / 100);
                        const jitterOffset = thumbnailJitter > 0 ? Math.floor(Math.random() * thumbnailJitter) : 0;
                        const timemarkSeconds = Math.max(1, Math.min(duration - 1, percentagePoint + jitterOffset)); // Ensure within bounds
                        (0, fluent_ffmpeg_1.default)(video.path)
                            .screenshots({
                            count: 1,
                            folder: path.dirname(video.thumbnail),
                            filename: path.basename(video.thumbnail),
                            timemarks: [timemarkSeconds.toString()],
                            size: '320x180'
                        })
                            .on('end', () => {
                            console.log('Thumbnail generated for', path.basename(video.path), `at ${timemarkSeconds}s (${thumbnailPercentage}% + ${jitterOffset}s jitter of ${duration}s)`);
                            resolve(true);
                        })
                            .on('error', (err) => {
                            console.error('Error generating thumbnail:', err);
                            resolve(false); // Don't fail the whole process
                        });
                    });
                });
            }
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
// Clear thumbnail cache
electron_1.ipcMain.handle('clear-thumbnail-cache', async () => {
    try {
        const thumbsDir = path.join(electron_1.app.getPath('userData'), 'thumbnails');
        if (fs.existsSync(thumbsDir)) {
            const files = fs.readdirSync(thumbsDir);
            for (const file of files) {
                const filePath = path.join(thumbsDir, file);
                try {
                    fs.unlinkSync(filePath);
                }
                catch (error) {
                    console.error('Error deleting cached thumbnail:', filePath, error);
                }
            }
            console.log('Thumbnail cache cleared');
            return true;
        }
        return true;
    }
    catch (error) {
        console.error('Error clearing thumbnail cache:', error);
        return false;
    }
});
