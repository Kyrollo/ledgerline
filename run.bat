@echo off
title LedgerLine - AP 3-Way Match
cls
echo ========================================================
echo       LedgerLine - AP 3-Way Matching Intelligence
echo ========================================================
echo.
echo [1/3] Checking dependencies...
python -c "import uvicorn, fastapi" 2>nul || pip install fastapi uvicorn
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend && npm install && cd ..
)

echo [2/3] Starting Backend API (Port 8009)...
start "LedgerLine API (Port 8009)" cmd /k "cd /d %~dp0backend && python -m uvicorn src.ledgerline.main:app --port 8009 --reload"

echo [3/3] Starting Frontend UI (Port 3009)...
start "LedgerLine UI (Port 3009)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:3009
echo.
echo LedgerLine is running!
echo   Frontend : http://localhost:3009
echo   Backend  : http://localhost:8009/docs
echo.
echo Press any key to stop all LedgerLine processes...
pause >nul
taskkill /fi "WINDOWTITLE eq LedgerLine API*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq LedgerLine UI*" /f >nul 2>&1
echo Done.
