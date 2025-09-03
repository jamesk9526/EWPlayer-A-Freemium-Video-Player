# EwPlayer - Native Windows Video Player

[![Version](https://img.shields.io/badge/version-1.1.3-blue.svg)](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/releases)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-25.0.0-purple.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue.svg)](https://www.typescriptlang.org/)

EwPlayer is a modern, native Windows video player built with Electron, React, and TypeScript. It provides a ewplayer-style interface for organizing and playing your video library with advanced features like automatic content detection, multi-player support, and comprehensive library management.

![EwPlayer Screenshot](https://via.placeholder.com/800x450/1a1a1a/ffffff?text=EwPlayer+Interface)

## ✨ Features

### 🎬 Core Video Playback
- **Native Performance**: Built with Electron for optimal Windows integration
- **Multi-Format Support**: MP4, MKV, MOV, WMV, FLV, M2TS, and more
- **Hardware Acceleration**: Leverages system video acceleration
- **Smooth Playback**: Optimized for various video resolutions and frame rates

### 📚 Smart Library Management
- **Automatic Content Detection**: Intelligently categorizes movies, TV shows, documentaries, and home videos
- **Metadata Extraction**: Parses filenames for season/episode info, years, and titles
- **Thumbnail Generation**: Automatic thumbnail creation for visual browsing
- **Advanced Search**: Filter by resolution, format, year, and content type
- **Organized Categories**: Separate views for Movies, TV Shows, and Home Videos

### 🎭 Theater Interface
- **ewplayer-Style UI**: Modern, cinematic browsing experience
- **Content Rows**: Organized by genre, continue watching, and recommendations
- **Hero Banners**: Featured content with play buttons
- **Responsive Design**: Adapts to different window sizes

### 🎮 Multi-Player Mode
- **Multiple Videos**: Play several videos simultaneously
- **Independent Controls**: Each player has its own playback controls
- **Window Management**: Dedicated multi-player window with custom layout

### 🔍 Advanced Search & Filtering
- **Smart Syntax**: Use `<1080>` for resolution, `[mp4]` for format, `{movie}` for type, `(2020)` for year
- **Real-time Suggestions**: Auto-complete search terms
- **Filter Combinations**: Mix multiple search criteria
- **Quick Access**: Keyboard shortcuts for common searches

### ⚙️ Comprehensive Settings
- **User Profiles**: Personalized experience with onboarding
- **Library Configuration**: Startup folders, excluded directories, auto-scan
- **Playback Preferences**: Volume, autoplay, loop settings
- **Interface Customization**: Card sizes, view modes, theater mode toggle
- **Cache Management**: Thumbnail cache control

### 💿 Optical Media Support
- **DVD Playback**: Direct DVD video playback
- **Blu-ray Support**: Compatible with Blu-ray disc structures
- **Disc Conversion**: Convert DVD titles to MP4 for better compatibility
- **Drive Detection**: Automatic optical drive detection

### 🖥️ Windows Integration
- **File Associations**: Double-click video files to open in EwPlayer
- **Context Menu**: Right-click integration for quick access
- **System Tray**: Minimize to tray for background operation
- **Keyboard Shortcuts**: Full keyboard navigation support

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11** (64-bit)
- **Node.js 16+** and **npm**
- **FFmpeg** (automatically included)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player.git
   cd VideoPlayerElectron
   ```

2. **Install dependencies**
   ```bash
   # Install main process dependencies
   npm install

   # Install renderer process dependencies
   cd src/renderer && npm install
   ```

3. **Development**
   ```bash
   # Start development server
   npm start
   ```

4. **Build for production**
   ```bash
   # Build the application
   npm run build

   # Create distributable
   npm run dist
   ```

## 📖 Usage

### First Time Setup
1. Launch EwPlayer
2. Complete the onboarding process
3. Add your video folders in Settings
4. Enable auto-scan for automatic library updates

### Adding Videos
- **Directory Scan**: Click "Select Directory" to scan entire folders
- **Single Files**: Use "Open File" for individual videos
- **Optical Media**: Insert DVD/Blu-ray and use "Open Disc"
- **Drag & Drop**: Drag video files directly into the application

### Search Syntax
```
# Search for 1080p videos
<1080>

# Search for MP4 files
[mp4]

# Search for movies
{movie}

# Search for content from 2020
(2020)

# Combine filters
<4k> [mkv] {movie} (2020)
```

### Keyboard Shortcuts
- `Ctrl+O`: Open file
- `Ctrl+D`: Select directory
- `Ctrl+Shift+M`: Open multi-player
- `F11`: Toggle fullscreen
- `Space`: Play/pause
- `Esc`: Exit fullscreen

## 🏗️ Architecture

### Project Structure
```
VideoPlayerElectron/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── ipc/                # IPC handlers
│   │   │   ├── discHandlers.ts     # Optical media
│   │   │   ├── videoHandlers.ts    # Video scanning
│   │   │   ├── settingsHandlers.ts # Settings
│   │   │   └── windowHandlers.ts   # Window controls
│   │   ├── windows/             # Window management
│   │   │   └── multiPlayerWindow.ts
│   │   ├── menus/              # Context menus
│   │   │   └── contextMenu.ts
│   │   └── main.ts             # Application entry
│   ├── renderer/               # React frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── types/          # TypeScript definitions
│   │   │   └── App.tsx         # Main React app
│   │   └── package.json
│   └── preload/                # Preload scripts
├── assets/                     # Icons and resources
├── docs/                       # Documentation
└── release/                    # Build outputs
```

### Technology Stack
- **Frontend**: React 18, TypeScript, CSS3
- **Backend**: Electron 25, Node.js
- **Video Processing**: FFmpeg, Fluent-FFmpeg
- **Build Tools**: Electron Builder, Webpack
- **Icons**: Custom SVG/PNG conversion

### Key Components
- **Library Manager**: Handles video scanning and metadata
- **Video Player**: Custom HTML5 video player with controls
- **Settings System**: Persistent configuration management
- **IPC Bridge**: Secure communication between processes
- **Thumbnail Generator**: Automatic video thumbnail creation

## 🔧 Configuration

### Settings Overview
EwPlayer offers extensive customization through its settings panel:

#### User Profile
- Personal information and preferences
- Onboarding completion status

#### Playback Settings
- Default volume levels
- Autoplay behavior
- Loop playback options

#### Library Management
- Startup scan folders
- Excluded directories
- Auto-detection preferences
- Content type overrides

#### Interface Customization
- Theater mode toggle
- Card size preferences
- Layout density options
- Cover style selection

#### Cache Management
- Thumbnail cache control
- Cache size limits
- Clear cache functionality

### File Associations
EwPlayer automatically registers file associations for:
- `.mp4` - MP4 Video
- `.avi` - AVI Video
- `.mkv` - MKV Video
- `.mov` - MOV Video
- `.wmv` - WMV Video
- `.flv` - FLV Video
- `.m2ts` - M2TS Video

## 🛠️ Development

### Development Setup
```bash
# Install all dependencies
npm install
cd src/renderer && npm install

# Start development
npm start

# Build for testing
npm run build
```

### Project Scripts
```json
{
  "start": "Concurrent development servers",
  "build": "Build both main and renderer",
  "build:main": "Build main process",
  "build:renderer": "Build renderer process",
  "dist": "Create distributable package",
  "icons:rebuild": "Regenerate application icons"
}
```

### Code Organization
The codebase follows a modular architecture:
- **Separation of Concerns**: Main process, renderer process, and preload scripts
- **Component-Based**: React components organized by functionality
- **Type Safety**: Comprehensive TypeScript definitions
- **IPC Abstraction**: Clean communication between processes

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📋 Requirements

### System Requirements
- **OS**: Windows 10 version 1903 or later (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for application, plus space for video cache
- **Display**: 1280x720 minimum resolution

### Dependencies
- **Runtime**: Node.js 16.0.0 or later
- **Build Tools**: Python 3.x (for node-gyp)
- **Video Codecs**: System video codecs for Windows

## 🐛 Troubleshooting

### Common Issues

**Videos not playing**
- Ensure video format is supported
- Check file permissions
- Verify FFmpeg installation

**Thumbnails not generating**
- Clear thumbnail cache in settings
- Check write permissions for thumbnails folder
- Restart the application

**Search not working**
- Ensure videos are properly scanned
- Check search syntax
- Try rebuilding the library

**Performance issues**
- Reduce thumbnail cache size
- Disable auto-scan on startup
- Close other applications

### Debug Mode
```bash
# Run with debug logging
set DEBUG=* & npm start
```

### Logs Location
- Application logs: `%APPDATA%\EwPlayer\logs\`
- Thumbnail cache: `%APPDATA%\EwPlayer\thumbnails\`
- Settings: `%APPDATA%\EwPlayer\settings.json`

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron**: Cross-platform desktop app framework
- **React**: UI library for the frontend
- **FFmpeg**: Video processing powerhouse
- **Electron Builder**: Application packaging
- **Sharp**: Image processing library

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/discussions)
- **Documentation**: [Wiki](https://github.com/jamesk9526/EWPlayer-A-Freemium-Video-Player/wiki)

## 🚀 Roadmap

### Planned Features
- [ ] Subtitle support and management
- [ ] Video editing capabilities
- [ ] Cloud sync for library data
- [ ] Mobile companion app
- [ ] Plugin system for extensions
- [ ] Advanced video filters
- [ ] Playlist management
- [ ] Social features (sharing, recommendations)

### Recent Updates
- **v1.1.3**: Multi-player window improvements
- **v1.1.2**: Enhanced search functionality
- **v1.1.0**: Theater interface implementation
- **v1.0.0**: Initial release with core features

---

**EwPlayer** - Your personal video library, reimagined for the modern desktop.
