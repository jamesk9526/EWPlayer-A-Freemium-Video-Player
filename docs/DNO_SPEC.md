DNO (Do Not Open) Private Library - Design Spec

Purpose
- Provide a private library for video folders that are hidden from the main UI unless a PIN is entered.
- The private library ("DNO List") allows adding video folders, removing them, and listing them only after PIN verification.

High-level contract
- Renderer requests via preload to perform actions: setPin, verifyPin, clearPin, addFolderToDNO, removeFolderFromDNO, listDNOFolders.
- All IPC calls return structured responses: { success: boolean, error?: string, data?: any }

Data shapes
- DNO folder entry:
  {
    id: string,        // UUID
    path: string,      // absolute folder path
    addedAt: number    // epoch ms
  }

- Storage file (JSON) stored in app.getPath('userData') under 'dno.json':
  {
    pinHash: string | null,     // salted/derived hash (never store plaintext)
    salt: string | null,        // base64 salt
    attempts: number,           // failed attempts counter
    lockUntil: number | null,   // epoch ms until which verification is blocked
    folders: DNOFolder[]        // array of entries
  }

PIN policy (assumptions)
- PIN: 4-8 numeric digits. We assume numeric PIN for convenience.
- Stored using PBKDF2-HMAC-SHA256 or Node crypto.scrypt to derive key; store salt and hash (hex/base64).
- On 5 failed attempts, lock for 15 minutes. Reset attempts after successful verify.

IPC channels (preload -> main)
- dno:setPin (args: { pin: string }) -> { success }
- dno:clearPin (args: { pin: string }) -> { success }
- dno:verifyPin (args: { pin: string }) -> { success }
- dno:addFolder (args: { path: string }) -> { success, entry }
- dno:removeFolder (args: { id: string }) -> { success }
- dno:listFolders (args: {}) -> { success, folders }
- dno:hasPin (args: {}) -> { success, hasPin }

Security notes
- All folder operations that return list or details must only succeed after verifyPin (in-memory session). The main process keeps a short-lived in-memory flag per session indicating verifiedUntil time.
- Preload exposes only the high-level functions; no direct access to Node fs from renderer.
- dno.json must be readable only by the user (OS-level) and not included in packaged asar resources.

Session
- After successful verifyPin, set verifiedUntil = now + 10 minutes (configurable). Calls that require verification check this timestamp.

Error codes and handling
- Errors are returned as descriptive strings. Specific cases:
  - "NO_PIN_SET" - when verify or clear called but no pin set
  - "INVALID_PIN" - wrong pin
  - "LOCKED" - too many attempts
  - "NOT_VERIFIED" - attempted listing without current verification
  - "NOT_FOUND" - folder id not present

Assumptions
- Project already uses Electron IPC and has a `preload.ts` that exposes functions to renderer.
- We'll add `docs/DNO_SPEC.md` and then implement step-by-step.

Next steps
- Implement main process helpers and storage.
- Expose API via preload and update renderer Settings UI component to allow create/enter PIN and add folders.

