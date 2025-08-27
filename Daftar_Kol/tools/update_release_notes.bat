@echo off
setlocal
REM Wrapper to update Daftar_Kol/RELEASE_NOTES.md using git commits
REM Runs the PowerShell script next to this file.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update_release_notes.ps1" -IncludeNoChangeDays

if %ERRORLEVEL% NEQ 0 (
  echo Failed to update release notes. ErrorLevel=%ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo Release notes updated successfully.
endlocal
