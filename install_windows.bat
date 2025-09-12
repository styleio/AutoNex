@echo off
echo ========================================
echo AutoNex Setup
echo ========================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found
    echo.
    echo Opening Python download page...
    start https://www.python.org/downloads/
    echo.
    echo Please install Python and check "Add Python to PATH"
    echo Then run this script again.
    pause
    exit /b
)

echo Python detected successfully.
python --version
echo.

:: Upgrade pip, setuptools and wheel first
echo Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel

:: Install packages from requirements.txt with no-cache to ensure fresh downloads
echo.
echo Installing required packages from requirements.txt...
echo This may take a few minutes...
echo.
pip install --no-cache-dir -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Some packages failed to install
    echo ========================================
    echo.
    echo If you see build errors, you may need to:
    echo 1. Install Microsoft C++ Build Tools:
    echo    https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo.
    echo 2. Or try installing pre-built wheels manually
    echo.
    pause
    exit /b
)

echo.
echo ========================================
echo Setup completed!
echo Starting server...
echo ========================================
echo.

:: Open browser
start cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

:: Start app
python app.py

pause