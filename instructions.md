# VideoPlayerElectron Refactoring Instructions

## Overview
This document outlines the comprehensive refactoring plan for the VideoPlayerElectron app to improve code organization, maintainability, and scalability.

## Completed Tasks ✅

### 1. File Structure Organization
- ✅ Created subfolders in `src/main/`: `windows/`, `menus/`, `ipc/`
- ✅ Moved files to appropriate locations:
  - `contextMenu.ts` → `src/main/menus/contextMenu.ts`
  - `multiPlayerWindow.ts` → `src/main/windows/multiPlayerWindow.ts`
  - `libraryManager.ts` → `src/main/ipc/libraryManager.ts`
- ✅ Created subfolders in `src/renderer/src/`: `pages/`, `components/`
- ✅ Moved page-level components to `pages/`:
  - `Library.tsx` → `src/renderer/src/pages/Library.tsx`
  - `Player.tsx` → `src/renderer/src/pages/Player.tsx`
  - `PlayerNew.tsx` → `src/renderer/src/pages/PlayerNew.tsx`
  - `MultiPlayer.tsx` → `src/renderer/src/pages/MultiPlayer.tsx`
- ✅ Moved UI components to `components/`:
  - `VideoCard.tsx` → `src/renderer/src/components/VideoCard.tsx`
  - `VideoCard.css` → `src/renderer/src/components/VideoCard.css`
  - `SettingsPanel.tsx` → `src/renderer/src/components/SettingsPanel.tsx`
- ✅ Updated import paths in `App.tsx` and other files
- ✅ Cleaned up duplicate files in root directory

### 2. Main Process Organization
- ✅ Extracted IPC handlers into separate files:
  - `discHandlers.ts` - Optical drive operations
  - `videoHandlers.ts` - File scanning and thumbnails
  - `settingsHandlers.ts` - Settings management
  - `windowHandlers.ts` - Window controls
- ✅ Updated main.ts to import handlers and reduced file size
- ✅ Adjusted paths for new file structure

## In Progress Tasks 🚧

### 3. Code Modularization
- 🔄 Extract reusable functions into utility files
- 🔄 Separate business logic from UI components
- 🔄 Create shared interfaces and types

### 4. TypeScript Improvements
- 🔄 Add proper type definitions
- 🔄 Enable strict mode
- 🔄 Add type guards and assertions

### 5. Error Handling
- 🔄 Add try-catch blocks
- 🔄 Implement proper error logging
- 🔄 Add user-friendly error messages

## Pending Tasks 📋

### 6. Dependency Management
- ⏳ Review and update package.json
- ⏳ Remove unused dependencies
- ⏳ Add missing dependencies for new features

### 7. Documentation
- ⏳ Add JSDoc comments to functions
- ⏳ Create API documentation
- ⏳ Update README with new features

### 8. Testing Setup
- ⏳ Set up testing framework (Jest/Vitest)
- ⏳ Add unit tests for utilities
- ⏳ Add integration tests for IPC communication

### 9. Performance Optimization
- ⏳ Implement lazy loading for components
- ⏳ Add memoization for expensive operations
- ⏳ Optimize bundle size

### 10. Final Review and Validation
- ⏳ Test all functionality after refactoring
- ⏳ Validate build process
- ⏳ Ensure no breaking changes

## Multi-Player Feature Integration
The refactoring has been designed to support the planned Multi-Player feature:
- Modular IPC handlers ready for multi-window communication
- Component structure supports multiple video players
- Settings system extensible for multi-player preferences

## Next Steps
1. Complete code modularization
2. Implement TypeScript improvements
3. Add comprehensive error handling
4. Set up testing infrastructure
5. Final validation and testing

## Notes
- All import paths have been updated to reflect new file structure
- Duplicate files in root directory have been marked as moved
- Main process handlers are now properly separated by concern
- Renderer components are organized by type (pages vs components)
