import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  showToolsMenu: (payload?: { videoId?: string }) => ipcRenderer.invoke('ui:show-tools-menu', payload),
  // Optional: if main handles search
  searchLibrary: (q: string) => ipcRenderer.invoke('library:search', q),

  // initial add
  onMultiInitial: (cb: (videoId: string) => void) => {
    const handler = (_: unknown, vid: string) => cb(vid);
    ipcRenderer.on('multi:add-initial', handler);
    return () => ipcRenderer.removeListener('multi:add-initial', handler);
  },
});