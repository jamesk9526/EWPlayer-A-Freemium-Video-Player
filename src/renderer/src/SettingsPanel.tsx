import React from 'react';

const ipcRenderer = (window as any).require('electron').ipcRenderer;

interface UserProfile {
  name: string;
  info: string;
  onboardingComplete: boolean;
}

interface SettingsPanelProps {
  settings: any;
  setSettings: (settings: any) => void;
  saveSettings: (settings: any) => Promise<void>;
  userProfile: UserProfile | null;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  setSettings,
  saveSettings,
  userProfile,
  onClose
}) => {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            className="settings-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>User Profile</h3>
            <div className="setting-item">
              <label htmlFor="profile-name">Name</label>
              <input
                type="text"
                id="profile-name"
                defaultValue={userProfile?.name || ''}
                placeholder="Enter your name"
              />
            </div>
            <div className="setting-item">
              <label htmlFor="profile-info">About</label>
              <textarea
                id="profile-info"
                defaultValue={userProfile?.info || ''}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Playback</h3>
            <div className="setting-item">
              <label htmlFor="autoplay">Auto-play next video</label>
              <input type="checkbox" id="autoplay" defaultChecked={settings.autoplay || false} />
            </div>
            <div className="setting-item">
              <label htmlFor="loop">Loop playback</label>
              <input type="checkbox" id="loop" defaultChecked={settings.loop || false} />
            </div>
            <div className="setting-item">
              <label htmlFor="volume">Default volume</label>
              <input type="range" id="volume" min="0" max="100" defaultValue={settings.volume || 70} />
            </div>
          </div>

          <div className="settings-section">
            <h3>Advanced Library Controls</h3>
            <div className="setting-item">
              <label htmlFor="group-by-folder">Group by folder structure</label>
              <input type="checkbox" id="group-by-folder" defaultChecked={settings.groupByFolder || false} />
              <span className="setting-description">Organize videos by their folder hierarchy</span>
            </div>
            <div className="setting-item">
              <label htmlFor="auto-detect-series">Auto-detect TV series</label>
              <input type="checkbox" id="auto-detect-series" defaultChecked={settings.autoDetectSeries !== false} />
              <span className="setting-description">Automatically group episodes into series based on naming patterns</span>
            </div>
            <div className="setting-item">
              <label htmlFor="show-file-details">Show file details</label>
              <input type="checkbox" id="show-file-details" defaultChecked={settings.showFileDetails || false} />
              <span className="setting-description">Display file size, resolution, and codec information</span>
            </div>
            <div className="setting-item">
              <label htmlFor="sort-order">Default sort order</label>
              <select id="sort-order" defaultValue={settings.sortOrder || "name-asc"}>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="date-asc">Date Added (Oldest First)</option>
                <option value="date-desc">Date Added (Newest First)</option>
                <option value="size-asc">File Size (Smallest First)</option>
                <option value="size-desc">File Size (Largest First)</option>
                <option value="modified-asc">Last Modified (Oldest First)</option>
                <option value="modified-desc">Last Modified (Newest First)</option>
              </select>
            </div>
            <div className="setting-item">
              <label htmlFor="filter-unwatched">Show only unwatched</label>
              <input type="checkbox" id="filter-unwatched" defaultChecked={settings.filterUnwatched || false} />
              <span className="setting-description">Hide videos that have been watched</span>
            </div>
            <div className="setting-item">
              <label htmlFor="hide-short-videos">Hide short videos</label>
              <input type="checkbox" id="hide-short-videos" defaultChecked={settings.hideShortVideos || false} />
              <span className="setting-description">Hide videos shorter than 5 minutes</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>File & Folder Management</h3>
            <div className="setting-item">
              <label>Marked Files & Folders</label>
              <p className="setting-description">
                Mark files or folders as favorites, watched, or hidden. Marked items will be highlighted in the library.
              </p>
              <div className="marked-items-list">
                {(settings.markedItems || []).map((item: any, index: number) => (
                  <div key={index} className="marked-item">
                    <span className={`marked-type ${item.type}`}>{item.type}</span>
                    <span className="marked-path" title={item.path}>{item.path.split(/[/\\]/).pop()}</span>
                    <span className="marked-tags">
                      {item.tags?.map((tag: string) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </span>
                    <button
                      type="button"
                      className="remove-marked-btn"
                      onClick={async () => {
                        const currentItems = settings.markedItems || [];
                        const newItems = currentItems.filter((_: any, i: number) => i !== index);
                        const updatedSettings = { ...settings, markedItems: newItems };
                        setSettings(updatedSettings);
                        await saveSettings(updatedSettings);
                      }}
                      title="Remove mark"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="marked-item add-new">
                  <button
                    type="button"
                    className="add-marked-btn"
                    onClick={async () => {
                      try {
                        const result = await ipcRenderer.invoke('select-file-or-folder');
                        if (result) {
                          const currentItems = settings.markedItems || [];
                          const newItem = {
                            path: result.path,
                            type: result.type, // 'file' or 'folder'
                            tags: ['favorite'],
                            markedAt: new Date().toISOString()
                          };
                          const newItems = [...currentItems, newItem];
                          const updatedSettings = { ...settings, markedItems: newItems };
                          setSettings(updatedSettings);
                          await saveSettings(updatedSettings);
                        }
                      } catch (error) {
                        console.error('Error selecting file/folder:', error);
                      }
                    }}
                    title="Add file or folder"
                  >
                    + Add File/Folder
                  </button>
                </div>
              </div>
            </div>
            <div className="setting-item">
              <label>Excluded Folders</label>
              <p className="setting-description">
                These folders will be completely excluded from library scans and won't appear in search results.
              </p>
              <div className="excluded-folders-list">
                {(settings.excludedFolders || []).map((folder: string, index: number) => (
                  <div key={index} className="excluded-folder-item">
                    <input
                      type="text"
                      value={folder}
                      readOnly
                      className="excluded-folder-input"
                      title={`Excluded folder: ${folder}`}
                    />
                    <button
                      type="button"
                      className="remove-excluded-btn"
                      onClick={async () => {
                        const currentFolders = settings.excludedFolders || [];
                        const newFolders = currentFolders.filter((_: string, i: number) => i !== index);
                        const updatedSettings = { ...settings, excludedFolders: newFolders };
                        setSettings(updatedSettings);
                        await saveSettings(updatedSettings);
                      }}
                      title="Remove exclusion"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="excluded-folder-item">
                  <input
                    type="text"
                    placeholder="Select a folder to exclude..."
                    readOnly
                    className="excluded-folder-input"
                    title="Click + to exclude a folder"
                  />
                  <button
                    type="button"
                    className="add-excluded-btn"
                    onClick={async () => {
                      try {
                        const folderPath = await ipcRenderer.invoke('select-directory');
                        if (folderPath) {
                          const currentFolders = settings.excludedFolders || [];
                          // Check if folder is already excluded
                          if (!currentFolders.includes(folderPath)) {
                            const newFolders = [...currentFolders, folderPath];
                            const updatedSettings = { ...settings, excludedFolders: newFolders };
                            setSettings(updatedSettings);
                            await saveSettings(updatedSettings);
                          } else {
                            alert('This folder is already excluded.');
                          }
                        }
                      } catch (error) {
                        console.error('Error selecting excluded folder:', error);
                      }
                    }}
                    title="Exclude folder"
                  >
                    +
                  </button>
                </div>
              </div>
              <small className="setting-help">Excluded folders will not be scanned for videos</small>
            </div>
          </div>

          <div className="settings-section">
            <h3>Content Organization</h3>
            <div className="setting-item">
              <label htmlFor="custom-categories">Custom categories</label>
              <div className="custom-categories-list">
                {(settings.customCategories || []).map((category: any, index: number) => (
                  <div key={index} className="category-item">
                    <input
                      type="text"
                      value={category.name}
                      className="category-name-input"
                      placeholder="Category name"
                      onChange={(e) => {
                        const currentCategories = settings.customCategories || [];
                        const newCategories = [...currentCategories];
                        newCategories[index] = { ...newCategories[index], name: e.target.value };
                        setSettings({ ...settings, customCategories: newCategories });
                      }}
                    />
                    <input
                      type="text"
                      value={category.pattern}
                      className="category-pattern-input"
                      placeholder="File pattern (regex)"
                      onChange={(e) => {
                        const currentCategories = settings.customCategories || [];
                        const newCategories = [...currentCategories];
                        newCategories[index] = { ...newCategories[index], pattern: e.target.value };
                        setSettings({ ...settings, customCategories: newCategories });
                      }}
                    />
                    <button
                      type="button"
                      className="remove-category-btn"
                      onClick={async () => {
                        const currentCategories = settings.customCategories || [];
                        const newCategories = currentCategories.filter((_: any, i: number) => i !== index);
                        const updatedSettings = { ...settings, customCategories: newCategories };
                        setSettings(updatedSettings);
                        await saveSettings(updatedSettings);
                      }}
                      title="Remove category"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="category-item add-new">
                  <button
                    type="button"
                    className="add-category-btn"
                    onClick={async () => {
                      const currentCategories = settings.customCategories || [];
                      const newCategory = { name: 'New Category', pattern: '' };
                      const newCategories = [...currentCategories, newCategory];
                      const updatedSettings = { ...settings, customCategories: newCategories };
                      setSettings(updatedSettings);
                      await saveSettings(updatedSettings);
                    }}
                    title="Add custom category"
                  >
                    + Add Category
                  </button>
                </div>
              </div>
              <small className="setting-help">Create custom categories based on filename patterns (supports regex)</small>
            </div>
            <div className="setting-item">
              <label htmlFor="auto-tag-content">Auto-tag content</label>
              <input type="checkbox" id="auto-tag-content" defaultChecked={settings.autoTagContent || false} />
              <span className="setting-description">Automatically add tags based on content analysis</span>
            </div>
            <div className="setting-item">
              <label htmlFor="content-rating">Content rating filter</label>
              <select id="content-rating" defaultValue={settings.contentRating || "all"}>
                <option value="all">Show All Content</option>
                <option value="g">General Audience</option>
                <option value="pg">Parental Guidance</option>
                <option value="pg13">PG-13</option>
                <option value="r">Restricted</option>
              </select>
              <span className="setting-description">Filter content based on maturity rating</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>Library</h3>
            <div className="setting-item">
              <label htmlFor="auto-scan">Auto-scan on startup</label>
              <input type="checkbox" id="auto-scan" defaultChecked={settings.autoScan || false} />
            </div>
            <div className="setting-item">
              <label htmlFor="startup-folders">Startup folders</label>
              <div className="folders-list">
                {(settings.startupFolders || []).map((folder: string, index: number) => (
                  <div key={index} className="folder-item">
                    <input
                      type="text"
                      id={`folder-${index}`}
                      value={folder}
                      readOnly
                      className="folder-input"
                      title={`Startup folder ${index + 1}: ${folder}`}
                    />
                    <button
                      type="button"
                      className="remove-folder-btn"
                      onClick={async () => {
                        const currentFolders = settings.startupFolders || [];
                        const newFolders = currentFolders.filter((_: string, i: number) => i !== index);
                        const updatedSettings = { ...settings, startupFolders: newFolders };
                        setSettings(updatedSettings);
                        await saveSettings(updatedSettings);
                      }}
                      title="Remove this folder"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="folder-item">
                  <input
                    type="text"
                    id="new-startup-folder"
                    placeholder="Select a folder to add..."
                    readOnly
                    className="folder-input"
                    title="Click + to add a new startup folder"
                  />
                  <button
                    type="button"
                    className="add-folder-btn"
                    onClick={async () => {
                      try {
                        const folderPath = await ipcRenderer.invoke('select-directory');
                        if (folderPath) {
                          const currentFolders = settings.startupFolders || [];
                          const newFolders = [...currentFolders, folderPath];
                          const updatedSettings = { ...settings, startupFolders: newFolders };
                          setSettings(updatedSettings);
                          await saveSettings(updatedSettings);
                          const input = document.getElementById('new-startup-folder') as HTMLInputElement;
                          if (input) {
                            input.value = '';
                          }
                        }
                      } catch (error) {
                        console.error('Error selecting startup folder:', error);
                      }
                    }}
                    title="Add folder"
                  >
                    +
                  </button>
                </div>
              </div>
              <small className="setting-help">These folders will be automatically scanned when the app starts (if auto-scan is enabled)</small>
            </div>
            <div className="setting-item">
              <label htmlFor="cache-thumbnails">Cache thumbnails</label>
              <input type="checkbox" id="cache-thumbnails" defaultChecked={settings.cacheThumbnails !== false} />
            </div>
            <div className="setting-item">
              <label htmlFor="default-view">Default view mode</label>
              <select id="default-view" defaultValue={settings.defaultView || "grid"}>
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Disc Playback</h3>
            <div className="setting-item">
              <label htmlFor="auto-convert">Auto-convert DVDs/Blu-rays</label>
              <input type="checkbox" id="auto-convert" defaultChecked={settings.autoConvert !== false} />
            </div>
            <div className="setting-item">
              <label htmlFor="conversion-quality">Conversion quality</label>
              <select id="conversion-quality" defaultValue={settings.conversionQuality || "medium"}>
                <option value="low">Low (Fast)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Slow)</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Cache Management</h3>
            <div className="setting-item">
              <div>
                <label>Thumbnail Cache</label>
                <p className="cache-description">
                  Thumbnails are automatically cached to improve performance. Clear cache to free up disk space.
                </p>
              </div>
              <button
                className="secondary-btn clear-cache-btn"
                onClick={async () => {
                  try {
                    const success = await ipcRenderer.invoke('clear-thumbnail-cache');
                    if (success) {
                      alert('Thumbnail cache cleared successfully!');
                    } else {
                      alert('Failed to clear thumbnail cache.');
                    }
                  } catch (error) {
                    console.error('Error clearing cache:', error);
                    alert('Error clearing thumbnail cache.');
                  }
                }}
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              // Collect current form values and save
              const form = document.querySelector('.settings-content') as HTMLElement;
              if (form) {
                const newSettings: any = {};
                const checkboxes = form.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((cb: any) => {
                  // Convert hyphenated IDs to camelCase
                  const settingKey = cb.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                  newSettings[settingKey] = cb.checked;
                  console.log(`Setting ${settingKey} (${cb.id}):`, cb.checked);
                });
                const selects = form.querySelectorAll('select');
                selects.forEach((sel: any) => {
                  const settingKey = sel.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                  newSettings[settingKey] = sel.value;
                });
                const ranges = form.querySelectorAll('input[type="range"]');
                ranges.forEach((range: any) => {
                  const settingKey = range.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                  newSettings[settingKey] = parseInt(range.value);
                });
                const inputs = form.querySelectorAll('input[type="text"], textarea');
                inputs.forEach((input: any) => {
                  if (input.id === 'profile-name') {
                    newSettings.userProfile = {
                      ...newSettings.userProfile,
                      name: input.value.trim(),
                      onboardingComplete: true
                    };
                  } else if (input.id === 'profile-info') {
                    newSettings.userProfile = {
                      ...newSettings.userProfile,
                      info: input.value.trim(),
                      onboardingComplete: true
                    };
                  } else if (input.id === 'startup-folder') {
                    // Legacy support - convert to startupFolders array
                    if (input.value.trim()) {
                      newSettings.startupFolders = [input.value.trim()];
                    }
                    console.log('Saving legacy startup folder:', input.value.trim());
                  } else if (input.id === 'new-startup-folder') {
                    // Skip the new folder input
                  } else {
                    // For other text inputs, convert to camelCase
                    const settingKey = input.id.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
                    newSettings[settingKey] = input.value.trim();
                  }
                });

                // Handle folder inputs
                const folderInputs = form.querySelectorAll('input[id^="folder-"]');
                const folders = Array.from(folderInputs)
                  .map(input => (input as HTMLInputElement).value.trim())
                  .filter(value => value.length > 0);
                newSettings.startupFolders = folders;
                console.log('Saving startup folders:', folders);

                // Handle excluded folders
                const excludedFolderInputs = form.querySelectorAll('input[class*="excluded-folder-input"]');
                const excludedFolders = Array.from(excludedFolderInputs)
                  .map(input => (input as HTMLInputElement).value.trim())
                  .filter(value => value.length > 0);
                newSettings.excludedFolders = excludedFolders;
                console.log('Saving excluded folders:', excludedFolders);

                // Handle custom categories
                const categoryNameInputs = form.querySelectorAll('input[class*="category-name-input"]');
                const categoryPatternInputs = form.querySelectorAll('input[class*="category-pattern-input"]');
                const customCategories = [];
                for (let i = 0; i < categoryNameInputs.length; i++) {
                  const nameInput = categoryNameInputs[i] as HTMLInputElement;
                  const patternInput = categoryPatternInputs[i] as HTMLInputElement;
                  if (nameInput.value.trim() && patternInput.value.trim()) {
                    customCategories.push({
                      name: nameInput.value.trim(),
                      pattern: patternInput.value.trim()
                    });
                  }
                }
                newSettings.customCategories = customCategories;
                console.log('Saving custom categories:', customCategories);

                // Ensure startupFolders is always an array in the saved settings
                if (!newSettings.startupFolders) {
                  newSettings.startupFolders = [];
                }

                saveSettings(newSettings);
                console.log('Final settings to save:', newSettings);
              }
              onClose();
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
