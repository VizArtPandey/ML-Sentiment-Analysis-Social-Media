#!/bin/bash

echo "=========================================="
echo " Starting ML Sentiment Analysis Project..."
echo "=========================================="

# 1. Setup Python Virtual Environment & Update Dependencies
echo "-> Setting up Python backend environment..."
# Automatically use python3
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip to fix the installation error we saw earlier, then install dependencies
python3 -m pip install --upgrade pip
pip3 install -r requirements.txt

# 2. Start Backend API in the background
echo "-> Freeing up port 8000 for FastAPI..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "-> Starting FastAPI Backend on port 8000..."
python3 backend/main.py &
BACKEND_PID=$!

echo "-> Running Model Validation Check (ensuring all models including BiLSTM load)..."
python3 test_all_models.py
if [ $? -ne 0 ]; then
    echo "ERROR: One or more ML Models failed to load! Shutting down."
    kill $BACKEND_PID
    exit 1
fi

# 3. Capture Ctrl+C so we can cleanly shut down the backend when you exit
trap "echo -e '\nShutting down backend...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT

# 4. Start the React Frontend
echo "-> Starting React Frontend..."
cd phase_05_react_ui
npm install
npm run dev
