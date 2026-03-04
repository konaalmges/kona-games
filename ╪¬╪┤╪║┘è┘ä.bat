@echo off
chcp 65001 >nul
title Kona Games - Server
color 0B

echo.
echo  ================================
echo   KONA GAMES - جاري التشغيل...
echo  ================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  Node.js غير مثبت!
    echo  حمله من: https://nodejs.org
    echo.
    pause
    exit /b
)

echo  السيرفر شغال على: http://localhost:3000
echo  لوحة الادمين: http://localhost:3000/admin
echo  لإيقاف السيرفر: Ctrl+C
echo.

start "" "http://localhost:3000"
node server.js
pause
