@echo off
setlocal EnableExtensions
title Classnote - Safe Git Push
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 goto FAILED

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto FAILED

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "REMOTE=%%R"
if not defined REMOTE goto WRONG_REMOTE
echo(%REMOTE% | findstr /I /C:"github.com/ndshuge/ndshuge-classnote" >nul
if errorlevel 1 goto WRONG_REMOTE

for /f "delims=" %%B in ('git branch --show-current') do set "BRANCH=%%B"
if not defined BRANCH goto FAILED

echo.
echo Repository: ndshuge/ndshuge-classnote
echo Branch: %BRANCH%
echo.
git status --short
echo.
echo WARNING: Untracked files are NOT staged automatically.
echo Review and stage new files manually with git add before publishing.
choice /C YN /M "Commit tracked changes and push this branch"
if errorlevel 2 goto CANCELLED

git add -u
if errorlevel 1 goto FAILED
git diff --cached --quiet
if errorlevel 2 goto FAILED
if errorlevel 1 (
  git commit -m "chore: update Classnote"
  if errorlevel 1 goto FAILED
)

git push -u origin HEAD
if errorlevel 1 goto FAILED
echo.
echo Push completed. Check deployment at:
echo https://ndshuge.github.io/ndshuge-classnote/
exit /b 0

:WRONG_REMOTE
echo ERROR: origin is not ndshuge/ndshuge-classnote.
echo No remote was changed.
exit /b 1

:CANCELLED
echo Publishing cancelled. No commit or push.
exit /b 0

:FAILED
echo ERROR: Git check, commit or push failed.
echo No force push or remote reset was performed.
exit /b 1
