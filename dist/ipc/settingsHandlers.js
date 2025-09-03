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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Settings IPC handlers
electron_1.ipcMain.handle('load-settings', async () => {
    try {
        const settingsPath = path.join(electron_1.app.getPath('userData'), 'settings.json');
        console.log('Main process: Loading settings from:', settingsPath);
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            const parsed = JSON.parse(data);
            console.log('Main process: Loaded settings:', parsed);
            return parsed;
        }
        console.log('Main process: No settings file found, returning empty object');
        return {}; // Default empty settings
    }
    catch (error) {
        console.error('Error loading settings:', error);
        return {};
    }
});
electron_1.ipcMain.handle('save-settings', async (event, settings) => {
    try {
        const settingsPath = path.join(electron_1.app.getPath('userData'), 'settings.json');
        console.log('Main process: Saving settings:', settings);
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('Main process: Settings saved successfully to:', settingsPath);
        return true;
    }
    catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
});
