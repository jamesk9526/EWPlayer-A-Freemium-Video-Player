@echo off
echo EwPlayer Build Fix Script
echo =========================
echo.

echo Step 1: Stopping any running Electron processes...
taskkill /f /im electron.exe /t 2>nul
if %errorlevel% equ 0 (
    echo  Stopped running Electron processes
) else (
    echo ~ No running Electron processes found
)
echo.

echo Step 2: Cleaning build directories...
if exist "dist-electron" (
    rmdir /s /q "dist-electron" 2>nul
    if %errorlevel% equ 0 (
        echo  Cleaned dist-electron
    ) else (
        echo  Could not clean dist-electron (may be in use)
    )
) else (
    echo ~ dist-electron not found, skipping
)

if exist "dist" (
    rmdir /s /q "dist" 2>nul
    if %errorlevel% equ 0 (
        echo  Cleaned dist
    ) else (
        echo  Could not clean dist (may be in use)
    )
) else (
    echo ~ dist not found, skipping
)

if exist "src\renderer\build" (
    rmdir /s /q "src\renderer\build" 2>nul
    if %errorlevel% equ 0 (
        echo  Cleaned src\renderer\build
    ) else (
        echo  Could not clean src\renderer\build (may be in use)
    )
) else (
    echo ~ src\renderer\build not found, skipping
)
echo.

echo Step 3: Waiting for file handles to release...
timeout /t 3 /nobreak >nul
echo.

echo  Build environment cleaned successfully!
echo.
echo Now run: npm run dist
echo.
pause