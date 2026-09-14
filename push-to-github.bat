@echo off
setlocal
title Push classnote to GitHub Pages

set "GH_USER=ndshuge"
set "REPO=ndshuge-classnote"

cd /d "%~dp0"

echo.
echo === [1/6] Checking Git ===
where git >nul 2>nul
if errorlevel 1 goto NOGIT
git --version
goto STEP2

:NOGIT
echo.
echo [ERROR] git not found on this machine.
echo Install it first: https://git-scm.com/download/win
echo After installing, close this window and run this file again.
goto END

:STEP2
echo.
echo === [2/6] Init repo ===
if exist ".git" goto SKIPINIT
git init
goto AFTERINIT

:SKIPINIT
echo .git already exists, skipping

:AFTERINIT
echo (default branch will be set to main after the first commit)

echo.
echo === [3/6] Commit identity ===
for /f "delims=" %%i in ('git config --global user.name') do set "GIT_NAME=%%i"
if not "%GIT_NAME%"=="" goto HAVEID
echo.
set /p GIT_NAME=Enter your name (any name, only for commit log): 
if "%GIT_NAME%"=="" set "GIT_NAME=%GH_USER%"

:HAVEID
for /f "delims=" %%i in ('git config --global user.email') do set "GIT_MAIL=%%i"
if not "%GIT_MAIL%"=="" goto HAVEID2
set "GIT_MAIL=%GH_USER%@users.noreply.github.com"

:HAVEID2
echo.
echo === [4/6] Commit files ===
git add -A
git -c user.name="%GIT_NAME%" -c user.email="%GIT_MAIL%" commit -m "lecture notes tool" 2>nul
echo (if it says "nothing to commit", that is fine)
git branch -M main

echo.
echo === [5/6] Set remote ===
git remote remove origin 2>nul
git remote add origin https://github.com/%GH_USER%/%REPO%.git
git remote -v

echo.
echo === [6/6] Push to GitHub ===
echo.
echo If a browser opens asking you to log in, just log in and authorize.
echo If it asks for a PASSWORD, use a Personal Access Token, NOT your account password.
echo Create a token here: https://github.com/settings/tokens
echo   -^> Generate new token (classic)
echo   -^> tick the "repo" scope
echo.
echo Press any key to start the push...
pause >nul
git push -u origin main
if errorlevel 1 goto PUSHFAIL

echo.
echo ============================================
echo  PUSH SUCCESS
echo.
echo  Now enable GitHub Pages:
echo  1. Open https://github.com/%GH_USER%/%REPO%/settings/pages
echo  2. Source: Deploy from a branch
echo  3. Branch: main   Folder: / (root)   then Save
echo  4. Wait 1-2 minutes, your site will be at:
echo     https://%GH_USER%.github.io/%REPO%/
echo ============================================
goto END

:PUSHFAIL
echo.
echo [FAILED] The push did not succeed.
echo Copy the error messages above and send them back.

:END
echo.
echo Press any key to close this window...
pause >nul
