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
    const mainWindow = electron_1.BrowserWindow.getFocusedWindow();
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
// Scan a disc for playable content or DVD-Video/Blu-ray structure
electron_1.ipcMain.handle('scan-disc', async (event, driveRoot) => {
    try {
        if (!driveRoot)
            return { kind: 'none' };
        const root = driveRoot.replace(/\\/g, '/');
        const normalized = /:\/$/.test(root) ? root : (root.endsWith('/') ? root : root + '/');
        const videoTs = path.join(normalized, 'VIDEO_TS');
        const bdmv = path.join(normalized, 'BDMV');
        const supportedExt = ['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'];
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
        if (fs.existsSync(bdmv) && fs.statSync(bdmv).isDirectory()) {
            // Blu-ray detected; look for STREAM folder and M2TS files
            const streamDir = path.join(bdmv, 'STREAM');
            if (fs.existsSync(streamDir) && fs.statSync(streamDir).isDirectory()) {
                const files = fs.readdirSync(streamDir).filter(f => /\.M2TS$/i.test(f));
                const groups = {};
                for (const f of files) {
                    const m = f.match(/^(\d{5})\.M2TS$/i);
                    if (!m)
                        continue;
                    const key = m[1];
                    const full = path.join(streamDir, f);
                    let size = 0;
                    try {
                        size = fs.statSync(full).size;
                    }
                    catch (_b) { }
                    if (!groups[key])
                        groups[key] = { total: 0, parts: [] };
                    groups[key].total += size;
                    groups[key].parts.push(full);
                }
                const best = Object.entries(groups).sort((a, b) => b[1].total - a[1].total)[0];
                if (best && best[1].parts.length) {
                    const m2ts = best[1].parts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                    return { kind: 'bluray', m2ts };
                }
                return { kind: 'bluray', m2ts: [] };
            }
        }
        // Otherwise, treat as data disc; scan up to depth 3
        const results = [];
        const thumbsDir = path.join(electron_1.app.getPath('userData'), 'thumbnails');
        try {
            fs.mkdirSync(thumbsDir, { recursive: true });
        }
        catch (_c) { }
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
// Convert a disc title (list of VOB or M2TS files) to an MP4 we can play (H.264/AAC)
electron_1.ipcMain.handle('convert-disc-title', async (event, filePaths) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0)
        return null;
    try {
        const cacheDir = path.join(electron_1.app.getPath('userData'), 'disc-cache');
        try {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        catch (_a) { }
        const listFile = path.join(cacheDir, `concat-${Date.now()}.txt`);
        const outFile = path.join(cacheDir, `disc-${Date.now()}.mp4`);
        // Write concat list
        const listContent = filePaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join(os.EOL);
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
        console.error('convert-disc-title error', e);
        return null;
    }
});
