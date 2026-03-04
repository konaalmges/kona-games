@echo off
chcp 65001 >nul
title Kona Games
color 0B

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo Node.js is not installed!
    echo Download from: https://nodejs.org
    pause
    exit /b
)

echo.
echo  ================================
echo   KONA GAMES - Starting...
echo   http://localhost:3000
echo  ================================
echo.

cd /d "%~dp0"
start "" "http://localhost:3000"
node server.js
pause
