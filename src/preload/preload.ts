import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),

  // File operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  showInExplorer: (filePath: string) => ipcRenderer.invoke('show-in-explorer', filePath),
  deleteVideo: (path: string) => ipcRenderer.invoke('delete-video', path),

  // Settings
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),

  // Video scanning
  scanVideos: (dir: string, options?: { thumbnailPercentage?: number; thumbnailJitter?: number }) => ipcRenderer.invoke('scan-videos', dir, options),

  // Disc operations
  chooseDiscDrive: () => ipcRenderer.invoke('choose-disc-drive'),
  scanDisc: (drive: string) => ipcRenderer.invoke('scan-disc', drive),
  convertDvdTitle: (vobs: string[]) => ipcRenderer.invoke('convert-dvd-title', vobs),

  // Context menu
  showToolsMenu: (payload?: { videoId?: string }) => ipcRenderer.invoke('ui:show-tools-menu', payload),

  // Search
  searchLibrary: (q: string) => ipcRenderer.invoke('library:search', q),

  // File/folder selection
  selectFileOrFolder: () => ipcRenderer.invoke('select-file-or-folder'),

  // Thumbnail cache
  clearThumbnailCache: () => ipcRenderer.invoke('clear-thumbnail-cache'),

  // Multi-player events
  onMultiInitial: (cb: (videoId: string) => void) => {
    const handler = (_: unknown, vid: string) => cb(vid);
    ipcRenderer.on('multi:add-initial', handler);
    return () => ipcRenderer.removeListener('multi:add-initial', handler);
  },

  // Window state events
  onWindowStateChanged: (cb: (state: string) => void) => {
    const handler = (_: unknown, state: string) => cb(state);
    ipcRenderer.on('window-state-changed', handler);
    return () => ipcRenderer.removeListener('window-state-changed', handler);
  },

  // File open events
  onOpenFile: (cb: (filePath: string) => void) => {
    const handler = (_: unknown, filePath: string) => cb(filePath);
    ipcRenderer.on('open-file', handler);
    return () => ipcRenderer.removeListener('open-file', handler);
  },
});