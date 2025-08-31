import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
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
    mainWindow.loadFile(path.join(__dirname, '../renderer/build/index.html'));
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
