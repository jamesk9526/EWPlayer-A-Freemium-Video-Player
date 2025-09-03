"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
console.log('DNO handlers loading...');
const STORE_FILE = path_1.default.join(electron_1.app.getPath('userData'), 'dno.json');
let verifiedUntil = 0; // epoch ms
console.log('DNO store file path:', STORE_FILE);
async function readStore() {
    try {
        const txt = await fs_1.promises.readFile(STORE_FILE, 'utf8');
        return JSON.parse(txt);
    }
    catch (e) {
        console.log('DNO store file not found, creating default store');
        return { pinHash: null, salt: null, attempts: 0, lockUntil: null, folders: [] };
    }
}
async function writeStore(s) {
    await fs_1.promises.mkdir(path_1.default.dirname(STORE_FILE), { recursive: true });
    await fs_1.promises.writeFile(STORE_FILE, JSON.stringify(s, null, 2), { encoding: 'utf8' });
}
function hashPin(pin, salt) {
    return new Promise((res, rej) => {
        crypto_1.default.scrypt(pin, salt, 64, (err, derivedKey) => {
            if (err)
                rej(err);
            else
                res(derivedKey);
        });
    });
}
electron_1.ipcMain.handle('dno:hasPin', async () => {
    console.log('DNO: hasPin called');
    const store = await readStore();
    const result = { success: true, hasPin: !!store.pinHash };
    console.log('DNO: hasPin result:', result);
    return result;
});
electron_1.ipcMain.handle('dno:setPin', async (_e, { pin }) => {
    console.log('DNO: setPin called with pin length:', pin === null || pin === void 0 ? void 0 : pin.length);
    if (!/^[0-9]{4,8}$/.test(pin)) {
        console.log('DNO: PIN policy violation');
        return { success: false, error: 'PIN_POLICY' };
    }
    try {
        const salt = crypto_1.default.randomBytes(16);
        const hash = await hashPin(pin, salt);
        const store = await readStore();
        store.pinHash = hash.toString('hex');
        store.salt = salt.toString('hex');
        store.attempts = 0;
        store.lockUntil = null;
        await writeStore(store);
        console.log('DNO: PIN set successfully');
        return { success: true };
    }
    catch (error) {
        console.error('DNO: Error setting PIN:', error);
        return { success: false, error: 'INTERNAL_ERROR' };
    }
});
electron_1.ipcMain.handle('dno:clearPin', async (_e, { pin }) => {
    console.log('DNO: clearPin called');
    const store = await readStore();
    if (!store.pinHash)
        return { success: false, error: 'NO_PIN_SET' };
    const salt = Buffer.from(store.salt, 'hex');
    const hash = await hashPin(pin, salt);
    if (hash.toString('hex') !== store.pinHash) {
        return { success: false, error: 'INVALID_PIN' };
    }
    store.pinHash = null;
    store.salt = null;
    store.attempts = 0;
    store.lockUntil = null;
    store.folders = [];
    await writeStore(store);
    return { success: true };
});
electron_1.ipcMain.handle('dno:verifyPin', async (_e, { pin }) => {
    console.log('DNO: verifyPin called');
    const now = Date.now();
    const store = await readStore();
    if (!store.pinHash)
        return { success: false, error: 'NO_PIN_SET' };
    if (store.lockUntil && store.lockUntil > now)
        return { success: false, error: 'LOCKED' };
    const salt = Buffer.from(store.salt, 'hex');
    const hash = await hashPin(pin, salt);
    if (hash.toString('hex') === store.pinHash) {
        store.attempts = 0;
        store.lockUntil = null;
        await writeStore(store);
        verifiedUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
        console.log('DNO: PIN verified successfully');
        return { success: true };
    }
    store.attempts = (store.attempts || 0) + 1;
    if (store.attempts >= 5) {
        store.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
    }
    await writeStore(store);
    console.log('DNO: PIN verification failed');
    return { success: false, error: 'INVALID_PIN' };
});
function ensureVerified() {
    const isVerified = Date.now() < verifiedUntil;
    console.log('DNO: ensureVerified check:', isVerified, 'verifiedUntil:', verifiedUntil, 'now:', Date.now());
    return isVerified;
}
electron_1.ipcMain.handle('dno:addFolder', async (_e, { path: folderPath }) => {
    console.log('DNO: addFolder called with path:', folderPath);
    if (!ensureVerified()) {
        console.log('DNO: addFolder failed - not verified');
        return { success: false, error: 'NOT_VERIFIED' };
    }
    const store = await readStore();
    const entry = { id: crypto_1.default.randomUUID(), path: folderPath, addedAt: Date.now() };
    store.folders.push(entry);
    await writeStore(store);
    console.log('DNO: folder added successfully');
    return { success: true, entry };
});
electron_1.ipcMain.handle('dno:removeFolder', async (_e, { id }) => {
    console.log('DNO: removeFolder called with id:', id);
    if (!ensureVerified()) {
        console.log('DNO: removeFolder failed - not verified');
        return { success: false, error: 'NOT_VERIFIED' };
    }
    const store = await readStore();
    const idx = store.folders.findIndex((f) => f.id === id);
    if (idx === -1)
        return { success: false, error: 'NOT_FOUND' };
    store.folders.splice(idx, 1);
    await writeStore(store);
    return { success: true };
});
electron_1.ipcMain.handle('dno:listFolders', async () => {
    console.log('DNO: listFolders called');
    if (!ensureVerified()) {
        console.log('DNO: listFolders failed - not verified');
        return { success: false, error: 'NOT_VERIFIED' };
    }
    const store = await readStore();
    console.log('DNO: listing folders:', store.folders.length);
    return { success: true, folders: store.folders };
});
console.log('DNO handlers loaded successfully');
