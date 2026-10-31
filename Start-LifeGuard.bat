@echo off
title LifeGuard - Starting App
echo ========================================================
echo      Launching LifeGuard AI Clinical Health Companion
echo ========================================================
echo.
cd /d "%~dp0"

:: Start the backend server in background if not already on port 5000
netstat -ano | findstr ":5000" >nul
if %errorlevel% neq 0 (
    echo Starting backend server on port 5000...
    start /b "" node backend/server.js
    timeout /t 2 /nobreak >nul
) else (
    echo Backend server is already running on port 5000.
)

:: Launch the Desktop Application
if exist "dist\LifeGuard-win32-x64\LifeGuard.exe" (
    echo Opening LifeGuard Desktop App...
    start "" "dist\LifeGuard-win32-x64\LifeGuard.exe"
) else (
    echo Opening LifeGuard in Browser...
    start http://localhost:3000
)

echo.
echo LifeGuard is ready!
