@echo off
title Baladi Tickets Auto-Sync

echo ==================================================
echo      Auto-syncing and pushing changes...
echo ==================================================

:: Go to the current directory dynamically
cd /d "%~dp0"

:: Add standard Git paths to PATH
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files (x86)\Git\cmd;%LocalAppData%\GitHubDesktop\bin"

:: Search for GitHub Desktop packaged Git dynamically if not found
where git >nul 2>nul
if errorlevel 1 (
    for /d %%d in ("%LocalAppData%\GitHubDesktop\app-*") do (
        if exist "%%d\resources\app\git\cmd\git.exe" (
            set "PATH=%PATH%;%%d\resources\app\git\cmd"
        )
    )
)

:: Verify Git is found
where git >nul 2>nul
if errorlevel 1 (
    echo ==================================================
    echo [ERROR] Git could not be located on your computer!
    echo Please make sure Git or GitHub Desktop is installed.
    echo ==================================================
    echo.
    pause
    exit /b
)

chcp 65001 >nul

:: Determine commit message
set "commit_msg=%~1"
if "%commit_msg%"=="" (
    echo.
    set /p "commit_msg=الرجاء إدخال اسم/وصف هذا التحديث بالعربي: "
)
if "%commit_msg%"=="" (
    set "commit_msg=تحديث تلقائي للنظام"
)

:: Execute Git commands
git add .
git commit -m "%commit_msg%"
git push

echo ==================================================
echo      Sync completed successfully!
echo ==================================================
echo Vercel is now building and deploying your changes...
echo.
pause
