# EwPlayer Build Fix Script
Write-Host "EwPlayer Build Fix Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Step 1: Kill any running Electron processes
Write-Host "Step 1: Stopping any running Electron processes..." -ForegroundColor Yellow
try {
    $electronProcesses = Get-Process -Name "electron" -ErrorAction SilentlyContinue
    if ($electronProcesses) {
        $electronProcesses | Stop-Process -Force
        Write-Host " Stopped running Electron processes" -ForegroundColor Green
    } else {
        Write-Host "~ No running Electron processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "~ No Electron processes to stop" -ForegroundColor Gray
}

# Step 2: Clean dist folders
Write-Host "Step 2: Cleaning build directories..." -ForegroundColor Yellow
$pathsToClean = @("dist-electron", "dist", "src\renderer\build")
foreach ($path in $pathsToClean) {
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force
            Write-Host " Cleaned $path" -ForegroundColor Green
        } catch {
            Write-Host " Could not clean $path (may be in use)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "~ $path not found, skipping" -ForegroundColor Gray
    }
}

# Step 3: Wait a moment for file handles to release
Write-Host "Step 3: Waiting for file handles to release..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host " Build environment cleaned successfully!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Now run: npm run dist" -ForegroundColor Cyan
