@echo off
rem CEN429 demo: FAKE program that runs instead of the real "hostname" (Windows).
rem Harmless: it only prints a warning to the screen. A real attacker could have
rem done anything here, with the privileges of the user running the program.
echo.
echo   !!! FAKE 'hostname' ran !!!
echo   The program was fooled through PATH. This line was not written by your
echo   code -- it comes from the fake\hostname.bat file in the demo folder.
echo.
