import { app, BrowserWindow, ipcMain, dialog } from 'electron';
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

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  mainWindow = new BrowserWindow({
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
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

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
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
        ffmpeg(video.path)
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
