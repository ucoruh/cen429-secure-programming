@echo off
rem Windows: runs demo.ps1 without asking for script permission (for double-click or cmd).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0demo.ps1"
