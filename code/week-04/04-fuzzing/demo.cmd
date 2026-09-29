@echo off
rem Windows: runs demo.ps1 without prompting for script permission (double-click or from cmd).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0demo.ps1"
