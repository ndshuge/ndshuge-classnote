@echo off
rem Kept as a backwards-compatible entry point. Safe push handles confirmation.
call "%~dp0push-to-github.bat"
exit /b %ERRORLEVEL%
