@echo off
setlocal
cd /d "%~dp0"

if exist "scripts\network-banner.js" (
    node scripts\network-banner.js 3000
)

echo Starting DnD 5e Character Sheet Server...
call npm.cmd run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server failed to start!
    echo Make sure you ran 1-Install.bat first.
    pause
)
