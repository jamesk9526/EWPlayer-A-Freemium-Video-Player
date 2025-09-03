import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFile, exec } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

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

  const mainWindow = BrowserWindow.getFocusedWindow();
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

// Scan a disc for playable content or DVD-Video/Blu-ray structure
ipcMain.handle('scan-disc', async (event, driveRoot: string) => {
  try {
    if (!driveRoot) return { kind: 'none' };
    const root = driveRoot.replace(/\\/g, '/');
    const normalized = /:\/$/.test(root) ? root : (root.endsWith('/') ? root : root + '/');
    const videoTs = path.join(normalized, 'VIDEO_TS');
    const bdmv = path.join(normalized, 'BDMV');
    const supportedExt = ['.mp4', '.mkv', '.mov', '.wmv', '.flv', '.m2ts'];

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

    if (fs.existsSync(bdmv) && fs.statSync(bdmv).isDirectory()) {
      // Blu-ray detected; look for STREAM folder and M2TS files
      const streamDir = path.join(bdmv, 'STREAM');
      if (fs.existsSync(streamDir) && fs.statSync(streamDir).isDirectory()) {
        const files = fs.readdirSync(streamDir).filter(f => /\.M2TS$/i.test(f));
        const groups: Record<string, { total: number; parts: string[] }> = {};
        for (const f of files) {
          const m = f.match(/^(\d{5})\.M2TS$/i);
          if (!m) continue;
          const key = m[1];
          const full = path.join(streamDir, f);
          let size = 0;
          try { size = fs.statSync(full).size; } catch {}
          if (!groups[key]) groups[key] = { total: 0, parts: [] };
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

// Convert a disc title (list of VOB or M2TS files) to an MP4 we can play (H.264/AAC)
ipcMain.handle('convert-disc-title', async (event, filePaths: string[]) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return null;
  try {
    const cacheDir = path.join(app.getPath('userData'), 'disc-cache');
    try { fs.mkdirSync(cacheDir, { recursive: true }); } catch {}
    const listFile = path.join(cacheDir, `concat-${Date.now()}.txt`);
    const outFile = path.join(cacheDir, `disc-${Date.now()}.mp4`);

    // Write concat list
    const listContent = filePaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join(os.EOL);
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
    console.error('convert-disc-title error', e);
    return null;
  }
});
