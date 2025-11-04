@echo off
echo ====================================
echo Learning Cents - Project Setup
echo ====================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file and add your API keys:
    echo   - OPENAI_API_KEY
    echo   - SUPABASE_URL
    echo   - SUPABASE_ANON_KEY
    echo   - DATABASE_URL
    echo   - PLAID_CLIENT_ID
    echo   - PLAID_SECRET
    echo.
    pause
) else (
    echo .env file already exists.
)

echo Installing dependencies...
call npm install

REM Validate environment variables (to be expanded in Story 19)
echo.
echo Validating environment configuration...
node -e "require('dotenv').config(); const missing = []; ['OPENAI_API_KEY','SUPABASE_URL','SUPABASE_ANON_KEY','DATABASE_URL'].forEach(key => { if (!process.env[key]) missing.push(key); }); if (missing.length > 0) { console.log('Missing required environment variables:', missing.join(', ')); process.exit(1); } else { console.log('Environment configuration valid!'); }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Missing required environment variables.
    echo Please update your .env file with the required keys.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Setup complete!
echo ====================================
echo.
echo Next steps:
echo   1. Run 'npm run dev' to start development server
echo   2. Run 'npm test' to run tests
echo.
