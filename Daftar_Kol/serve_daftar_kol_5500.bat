@echo off
setlocal ENABLEDELAYEDEXPANSION
set PORT=5500

rem Detect Python launcher or python.exe
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  set PY=python
) else (
  where py >nul 2>nul
  if %ERRORLEVEL%==0 (
    set PY=py
  ) else (
    echo Python was not found. Please install Python (winget install -e --id Python.Python.3.12) and re-run this script.
    pause
    exit /b 1
  )
)

echo Starting server at http://localhost:%PORT%
"%PY%" -m http.server %PORT% --directory .
