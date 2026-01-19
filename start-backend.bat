@echo off
REM Backend Startup Script for Real-Time Product Price Intelligence Dashboard
REM This script will start the backend server with all necessary checks

echo ==================================================
echo   Product Price Intelligence Backend Startup
echo ==================================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node -v >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%
echo.

REM Check if npm is installed
echo Checking npm installation...
npm -v >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm found: v%NPM_VERSION%
echo.

REM Check if node_modules exists
echo Checking dependencies...
if not exist "node_modules\" (
    echo Dependencies not found. Installing...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully
) else (
    echo [OK] Dependencies already installed
)
echo.

REM Check if .env file exists
echo Checking environment configuration...
if not exist ".env" (
    echo Creating .env file with default values...
    (
        echo PORT=3000
        echo NODE_ENV=development
        echo H2_DB_PATH=./data/products
        echo H2_DB_USER=sa
        echo H2_DB_PASSWORD=
    ) > .env
    echo [OK] .env file created
) else (
    echo [OK] .env file exists
)
echo.

REM Check if backend server file exists
echo Checking backend server files...
if not exist "src\backend\server.js" (
    echo Error: Backend server file not found
    echo Expected: src\backend\server.js
    pause
    exit /b 1
)
echo [OK] Backend server files found
echo.

REM Create data directory if it doesn't exist
if not exist "data\" (
    mkdir data
    echo [OK] Data directory created
)
echo.

REM Display startup information
echo ==================================================
echo   Starting Backend Server
echo ==================================================
echo.
echo   Server URL:    http://localhost:3000
echo   Health Check:  http://localhost:3000/health
echo   API Base:      http://localhost:3000/api
echo.
echo   Available Endpoints:
echo     GET  /health
echo     POST /api/add-product
echo     GET  /api/get-prices
echo     GET  /api/get-history
echo     POST /api/scrape
echo     GET  /api/ai-summary
echo     GET  /api/products
echo.
echo   Documentation:
echo     - BACKEND_API.md (API Reference)
echo     - QUICK_START.md (Getting Started)
echo     - ARCHITECTURE.md (System Design)
echo.
echo ==================================================
echo.
echo Starting server in 3 seconds...
timeout /t 3 /nobreak >nul

REM Start the server
call npm run backend:dev
