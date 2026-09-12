@echo off
cd /d "%~dp0"
if not defined PORT set "PORT=4173"
node scripts\start-site.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:%PORT%/"
