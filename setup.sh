#!/bin/bash

echo "===================================="
echo "Learning Cents - Project Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env file and add your API keys:"
    echo "  - OPENAI_API_KEY"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - DATABASE_URL"
    echo "  - PLAID_CLIENT_ID"
    echo "  - PLAID_SECRET"
    echo ""
    read -p "Press enter to continue..."
else
    echo ".env file already exists."
fi

echo "Installing dependencies..."
npm install

# Validate environment variables
echo ""
echo "Validating environment configuration..."
node -e "require('dotenv').config(); const missing = []; ['OPENAI_API_KEY','SUPABASE_URL','SUPABASE_ANON_KEY','DATABASE_URL'].forEach(key => { if (!process.env[key]) missing.push(key); }); if (missing.length > 0) { console.log('Missing required environment variables:', missing.join(', ')); process.exit(1); } else { console.log('Environment configuration valid!'); }"

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Missing required environment variables."
    echo "Please update your .env file with the required keys."
    exit 1
fi

echo ""
echo "===================================="
echo "Setup complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start development server"
echo "  2. Run 'npm test' to run tests"
echo ""
