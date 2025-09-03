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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultiPlayerWindow = createMultiPlayerWindow;
const electron_1 = require("electron");
const path = __importStar(require("node:path"));
let multiPlayerWin = null;
function createMultiPlayerWindow(payload) {
    if (multiPlayerWin && !multiPlayerWin.isDestroyed()) {
        multiPlayerWin.focus();
        if (payload === null || payload === void 0 ? void 0 : payload.initialVideoId) {
            multiPlayerWin.webContents.send('multi:add-initial', payload.initialVideoId);
        }
        return;
    }
    multiPlayerWin = new electron_1.BrowserWindow({
        width: 1280,
        height: 840,
        title: 'Multi-Player',
        show: false,
        vibrancy: 'sidebar',
        backgroundColor: '#111111',
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    // If you use React Router, point to a route like #/multi-player
    const url = process.env.VITE_DEV_SERVER_URL
        ? `${process.env.VITE_DEV_SERVER_URL}#/multi-player`
        : `file://${path.join(__dirname, '../../src/renderer/build/index.html')}#/multi-player`;
    multiPlayerWin.loadURL(url);
    multiPlayerWin.once('ready-to-show', () => {
        multiPlayerWin === null || multiPlayerWin === void 0 ? void 0 : multiPlayerWin.show();
        if (payload === null || payload === void 0 ? void 0 : payload.initialVideoId) {
            multiPlayerWin === null || multiPlayerWin === void 0 ? void 0 : multiPlayerWin.webContents.send('multi:add-initial', payload.initialVideoId);
        }
    });
    multiPlayerWin.on('closed', () => (multiPlayerWin = null));
}
// (optional) handle window-level search in main if your library lives here
electron_1.ipcMain.handle('library:search', async (_evt, q) => {
    // TODO: replace with your real library search
    // return await myLibrary.search(q)
    return []; // stub
});
