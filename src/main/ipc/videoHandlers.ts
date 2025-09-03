import { ipcMain, app, BrowserWindow, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  // Handle both development and production paths
  let ffmpegPath = ffmpegStatic as string;
  
  // In packaged app, ffmpeg-static is unpacked to .asar.unpacked
  if (app.isPackaged) {
    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
    if (fs.existsSync(unpackedPath)) {
      ffmpegPath = unpackedPath;
    } else {
      // Fallback: try the original path (might work if asarUnpack worked differently)
      const asarPath = path.join(process.resourcesPath, 'app.asar', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
      if (fs.existsSync(asarPath)) {
        ffmpegPath = asarPath;
      }
    }
  }
  
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log('FFmpeg path set to:', ffmpegPath);
} else {
  console.warn('ffmpeg-static not found; relying on system ffmpeg in PATH');
}

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
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

ipcMain.handle('scan-videos', async (event, dirPath: string, options?: { thumbnailPercentage?: number; thumbnailJitter?: number }) => {
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
          if (['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'].includes(ext)) {
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
          ffmpeg.ffprobe(video.path, (err, metadata) => {
            if (err) {
              console.error('Error getting video metadata:', err);
              resolve(false);
              return;
            }

            const duration = metadata.format?.duration || 0;
            const thumbnailPercentage = options?.thumbnailPercentage || 50;
            const thumbnailJitter = options?.thumbnailJitter || 0;
            const percentagePoint = Math.floor((duration * thumbnailPercentage) / 100);
            const jitterOffset = thumbnailJitter > 0 ? Math.floor(Math.random() * thumbnailJitter) : 0;
            const timemarkSeconds = Math.max(1, Math.min(duration - 1, percentagePoint + jitterOffset)); // Ensure within bounds

            ffmpeg(video.path)
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

// Clear thumbnail cache
ipcMain.handle('clear-thumbnail-cache', async () => {
  try {
    const thumbsDir = path.join(app.getPath('userData'), 'thumbnails');
    if (fs.existsSync(thumbsDir)) {
      const files = fs.readdirSync(thumbsDir);
      for (const file of files) {
        const filePath = path.join(thumbsDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Error deleting cached thumbnail:', filePath, error);
        }
      }
      console.log('Thumbnail cache cleared');
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error clearing thumbnail cache:', error);
    return false;
  }
});
