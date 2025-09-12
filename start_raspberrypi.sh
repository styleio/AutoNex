#!/bin/bash
# 簡易版：既にPythonと必要なパッケージがインストールされている場合用

VENV_NAME="venv"

# Check if virtual environment exists
if [ ! -d "$VENV_NAME" ]; then
    echo "Virtual environment not found!"
    echo "Please run ./install_raspberrypi.sh first"
    exit 1
fi

# Activate virtual environment
source $VENV_NAME/bin/activate

# Open browser if GUI is available
if command -v xdg-open &> /dev/null
then
    xdg-open http://localhost:5000 &
fi

# Start app
python app.py