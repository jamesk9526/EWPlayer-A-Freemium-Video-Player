import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFile, exec } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string);
} else {
  console.warn('ffmpeg-static not found; relying on system ffmpeg in PATH');
}

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
  mainWindow = new BrowserWindow({
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

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
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
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
// Utility: run a PowerShell command and return stdout
function runPowerShell(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use -NoProfile for speed and predictability
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        console.error('PowerShell error:', error, stderr);
        reject(error);
        return;
      }
      resolve(stdout.toString());
    });
  });
}

async function listOpticalDrivesWin(): Promise<Array<{ letter: string; label: string }>> {
  if (process.platform !== 'win32') return [];
  try {
    const ps = `Get-Volume | Where-Object { $_.DriveType -eq 'CD-ROM' -and $_.DriveLetter } | Select-Object DriveLetter, FileSystemLabel | ConvertTo-Json -Compress`;
    const out = await runPowerShell(ps);
    if (!out) return [];
    let data: any;
    try { data = JSON.parse(out); } catch { return []; }
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return arr.map((d: any) => ({
      letter: (d.DriveLetter || '').toString().toUpperCase(),
      label: (d.FileSystemLabel || '').toString()
    }));
  } catch (e) {
    console.error('Failed to list optical drives', e);
    return [];
  }
}

// Detect optical (CD/DVD) drives on Windows using PowerShell
ipcMain.handle('list-optical-drives', async () => {
  return listOpticalDrivesWin();
});

// Prompt the user to choose a disc drive if multiple
ipcMain.handle('choose-disc-drive', async () => {
  const safeDrives = await listOpticalDrivesWin();

  if (!mainWindow) return null;
  if (safeDrives.length === 0) {
    await dialog.showMessageBox(mainWindow, { type: 'info', message: 'No disc drives detected', detail: 'Insert a DVD or CD and try again.' });
    return null;
  }
  if (safeDrives.length === 1) {
    return `${safeDrives[0].letter}:/`;
  }
  const buttons = safeDrives.map(d => `${d.letter}:/ ${d.label || 'Disc'}`);
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    message: 'Choose a disc drive',
    buttons,
    cancelId: -1,
    noLink: true
  });
  const idx = result.response;
  if (idx < 0 || idx >= safeDrives.length) return null;
  return `${safeDrives[idx].letter}:/`;
});

// Scan a disc for playable content or DVD-Video structure
ipcMain.handle('scan-disc', async (event, driveRoot: string) => {
  try {
    if (!driveRoot) return { kind: 'none' };
  const root = driveRoot.replace(/\\/g, '/');
    const normalized = /:\/$/.test(root) ? root : (root.endsWith('/') ? root : root + '/');
    const videoTs = path.join(normalized, 'VIDEO_TS');
    const supportedExt = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'];

    if (fs.existsSync(videoTs) && fs.statSync(videoTs).isDirectory()) {
      // DVD-Video detected; select VTS with largest total size
      const files = fs.readdirSync(videoTs).filter(f => /\.VOB$/i.test(f));
      const groups: Record<string, { total: number; parts: string[] }> = {};
      for (const f of files) {
        const m = f.match(/^(VTS_\d{2})_\d+\.VOB$/i);
        if (!m) continue;
        const key = m[1].toUpperCase();
        const full = path.join(videoTs, f);
        let size = 0;
        try { size = fs.statSync(full).size; } catch {}
        if (!groups[key]) groups[key] = { total: 0, parts: [] };
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
    const results: { path: string; thumbnail: string }[] = [];
    const thumbsDir = path.join(app.getPath('userData'), 'thumbnails');
    try { fs.mkdirSync(thumbsDir, { recursive: true }); } catch {}

    const scan = (dir: string, depth: number) => {
      if (depth > 3) return;
      let entries: string[] = [];
      try { entries = fs.readdirSync(dir); } catch { return; }
      for (const name of entries) {
        const p = path.join(dir, name);
        let st: fs.Stats | null = null;
        try { st = fs.statSync(p); } catch { continue; }
        if (st.isDirectory()) {
          scan(p, depth + 1);
        } else {
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
  } catch (e) {
    console.error('scan-disc error', e);
    return { kind: 'none', error: String(e) };
  }
});

// Convert a DVD title (list of VOB files) to an MP4 we can play (H.264/AAC)
ipcMain.handle('convert-dvd-title', async (event, vobPaths: string[]) => {
  if (!Array.isArray(vobPaths) || vobPaths.length === 0) return null;
  try {
    const cacheDir = path.join(app.getPath('userData'), 'dvd-cache');
    try { fs.mkdirSync(cacheDir, { recursive: true }); } catch {}
    const listFile = path.join(cacheDir, `concat-${Date.now()}.txt`);
    const outFile = path.join(cacheDir, `dvd-${Date.now()}.mp4`);

    // Write concat list
    const listContent = vobPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join(os.EOL);
    fs.writeFileSync(listFile, listContent, 'utf8');

    // Use fluent-ffmpeg to run the conversion
    const result: string = await new Promise((resolve, reject) => {
      ffmpeg()
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

    try { fs.unlinkSync(listFile); } catch {}
    return result || null;
  } catch (e) {
    console.error('convert-dvd-title error', e);
    return null;
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
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

ipcMain.handle('show-in-explorer', async (event, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('get-file-info', async (event, filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
});

ipcMain.handle('scan-videos', async (event, dirPath: string) => {
  const videos: { path: string; thumbnail: string }[] = [];
  function scanDir(dir: string) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          scanDir(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'].includes(ext)) {
            const thumbsDir = path.join(app.getPath('userData'), 'thumbnails');
            try { fs.mkdirSync(thumbsDir, { recursive: true }); } catch {}
            const thumbnailPath = path.join(thumbsDir, path.basename(file, ext) + '.jpg');
            videos.push({ path: filePath, thumbnail: thumbnailPath });
          }
        }
      }
    } catch (error) {
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
        ffmpeg.ffprobe(video.path, (err, metadata) => {
          if (err) {
            console.error('Error getting video metadata:', err);
            resolve(false);
            return;
          }
          
          const duration = metadata.format?.duration || 0;
          const midPoint = Math.floor(duration / 2); // 50% of video duration
          const timemarkSeconds = midPoint > 0 ? midPoint : 20; // Fallback to 1 second if duration can't be determined
          
          ffmpeg(video.path)
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
    } catch (error) {
      console.error('Thumbnail generation failed for:', video.path);
    }
  }

  return videos;
});

ipcMain.handle('delete-video', async (event, videoPath: string) => {
  try {
    fs.unlinkSync(videoPath);
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
});

// Window control handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
