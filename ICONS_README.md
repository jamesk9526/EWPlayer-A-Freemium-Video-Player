# EwPlayer Icons Setup Guide

## Required Icon Files

Your app needs these icon files in the \ssets/\ folder:

### 1. Main App Icon: \icon.ico\
- **Purpose**: Main application icon (taskbar, desktop, start menu)
- **Sizes needed**: 256x256, 128x128, 64x64, 32x32, 16x16
- **Current status**:  Placeholder file created

### 2. Video File Icon: \ideo-icon.ico\ 
- **Purpose**: Icon for video files when associated with EwPlayer
- **Sizes needed**: 256x256, 128x128, 64x64, 32x32, 16x16
- **Current status**:  Placeholder file created

## How to Create Proper ICO Files

### Option 1: Online Converters (Recommended)
1. Use the provided SVG files (\icon.svg\, \ideo-icon.svg\)
2. Go to: https://cloudconvert.com/svg-to-ico
3. Upload the SVG file
4. Select output sizes: 256, 128, 64, 32, 16 pixels
5. Download and replace the placeholder files

### Option 2: Using Image Editing Software
1. Open \icon.svg\ in software like:
   - Adobe Illustrator
   - Inkscape (free)
   - GIMP (free)
2. Export as ICO with multiple sizes
3. Save as \ssets/icon.ico\

### Option 3: Using Online Icon Generators
1. Visit: https://favicon.io/favicon-converter/
2. Upload your SVG or PNG
3. Generate ICO file
4. Download and place in \ssets/\ folder

## Quick Setup (Using the Build Script)

Run the provided build fix script:
\\\powershell
.\\fix-build.ps1
\\\

This script will:
- Stop any running Electron processes
- Clean build directories
- Rebuild the application
- Create the distributable package

## Icon Design Guidelines

### Main App Icon (\icon.svg\)
- Red gradient background (#ff0000 to #cc0000)
- White play triangle
- Clean, modern design
- Works well at small sizes

### Video File Icon (\ideo-icon.svg\)
- Blue gradient background (#4a90e2 to #357abd)
- White play button overlay
- Filmstrip details for video context
- Distinct from main app icon

## Testing Icons

After creating proper ICO files:

1. Run the build: \
pm run dist\
2. Install the generated installer
3. Check that:
   - Desktop shortcut has correct icon
   - Taskbar icon displays properly
   - Start menu entry has correct icon
   - Video files show the video icon in Explorer

## Troubleshooting

**Build still fails?**
- Make sure no Electron apps are running
- Try running the fix-build.ps1 script
- Restart your computer if needed

**Icons not showing?**
- Ensure ICO files are valid (try opening them in Windows)
- Check file paths in package.json
- Rebuild after replacing icon files

**File associations not working?**
- Right-click a video file
- Select "Open with" > "Choose another app"
- Select EwPlayer from the list
- Check "Always use this app"