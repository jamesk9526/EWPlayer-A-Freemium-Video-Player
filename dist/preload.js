"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
console.log('Preload script loading...');
electron_1.contextBridge.exposeInMainWorld('api', {
    showToolsMenu: (payload) => electron_1.ipcRenderer.invoke('ui:show-tools-menu', payload),
    // Optional: if main handles search
    searchLibrary: (q) => electron_1.ipcRenderer.invoke('library:search', q),
    // initial add
    onMultiInitial: (cb) => {
        const handler = (_, vid) => cb(vid);
        electron_1.ipcRenderer.on('multi:add-initial', handler);
        return () => electron_1.ipcRenderer.removeListener('multi:add-initial', handler);
    },
    // Directory selection
    selectDirectory: () => {
        console.log('Preload: calling select-directory');
        return electron_1.ipcRenderer.invoke('select-directory');
    },
});
console.log('Preload script loaded successfully');
