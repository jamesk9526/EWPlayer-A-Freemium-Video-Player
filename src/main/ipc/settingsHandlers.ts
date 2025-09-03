import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Settings IPC handlers
ipcMain.handle('load-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    console.log('Main process: Loading settings from:', settingsPath);
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const parsed = JSON.parse(data);
      console.log('Main process: Loaded settings:', parsed);
      return parsed;
    }
    console.log('Main process: No settings file found, returning empty object');
    return {}; // Default empty settings
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
});

ipcMain.handle('save-settings', async (event, settings: any) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    console.log('Main process: Saving settings:', settings);
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('Main process: Settings saved successfully to:', settingsPath);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
});
