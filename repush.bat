@echo off
setlocal
title Push update to GitHub Pages

cd /d "%~dp0"

echo.
echo === Pushing update ===
echo.

git add -A
git commit -m "update" 2>nul
echo (nothing to commit means no change, that is fine)

echo.
echo Uploading to GitHub...
echo.
git push

if errorlevel 1 goto FAIL

echo.
echo ============================================
echo  DONE - update is live
echo.
echo  Wait 1-2 minutes, then refresh your page:
echo  https://ndshuge.github.io/ndshuge-classnote/
echo ============================================
goto END

:FAIL
echo.
echo [FAILED] Something went wrong. Copy the text above and send it back.

:END
echo.
echo Press any key to close...
pause >nul
