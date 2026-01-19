@echo off
REM Complete System Setup Script for Windows
REM Real-Time Product Price Intelligence Dashboard

echo ==================================================
echo   Product Price Intelligence - System Setup
echo ==================================================
echo.

REM Check Node.js
echo Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

REM Check Python
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found
        echo Please install Python from https://python.org/
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)
for /f "tokens=*" %%i in ('%PYTHON_CMD% --version') do set PYTHON_VERSION=%%i
echo [OK] %PYTHON_VERSION%

REM Check Ollama
echo Checking Ollama...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama not found
    echo Please install from: https://ollama.ai/download
    echo.
    echo Continue anyway? (Y/N)
    set /p CONTINUE=
    if /i not "%CONTINUE%"=="Y" exit /b 1
) else (
    echo [OK] Ollama found
)

REM Install Node dependencies
echo.
echo Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install Node dependencies
    pause
    exit /b 1
)
echo [OK] Node dependencies installed

REM Install Python dependencies
echo.
echo Installing Python dependencies...
%PYTHON_CMD% -m pip install -r requirements-scraper.txt
if errorlevel 1 (
    echo [WARNING] Some Python dependencies might have failed
)
echo [OK] Python dependencies installed

REM Pull Mistral model
echo.
echo Checking Ollama Mistral model...
ollama pull mistral
echo [OK] Mistral model ready

REM Create data directory
if not exist "data\" mkdir data

echo.
echo ==================================================
echo   Setup Complete!
echo ==================================================
echo.
echo Next Steps:
echo.
echo 1. Start Ollama:
echo    ollama run mistral
echo.
echo 2. In a new terminal, start Backend:
echo    npm run backend:dev
echo.
echo 3. In another terminal, start Frontend:
echo    npm run dev
echo.
echo 4. Open your browser:
echo    http://localhost:3001
echo.
echo Ready to analyze product prices!
echo.
pause
