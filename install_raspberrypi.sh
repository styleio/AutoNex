#!/bin/bash

echo "========================================"
echo "AutoNex Setup for Raspberry Pi"
echo "========================================"
echo

# Check Python
if ! command -v python3 &> /dev/null
then
    echo "Python3 not found. Installing..."
    echo
    
    # Update package list
    sudo apt update
    
    # Install Python3 and pip
    sudo apt install -y python3 python3-pip python3-venv
    
    if [ $? -ne 0 ]; then
        echo
        echo "ERROR: Failed to install Python3"
        echo "Please check your internet connection and try again."
        exit 1
    fi
else
    echo "Python3 detected successfully."
    python3 --version
fi

echo

# Upgrade pip, setuptools and wheel first
echo "Upgrading pip, setuptools, and wheel..."
python3 -m pip install --upgrade pip setuptools wheel

# Install packages from requirements.txt
echo
echo "Installing required packages from requirements.txt..."
echo "This may take a few minutes..."
echo
pip3 install --no-cache-dir -r requirements.txt

if [ $? -ne 0 ]; then
    echo
    echo "========================================"
    echo "ERROR: Some packages failed to install"
    echo "========================================"
    echo
    echo "You may need to install additional system packages:"
    echo "  sudo apt install -y python3-dev build-essential"
    echo
    exit 1
fi

echo
echo "========================================"
echo "Setup completed!"
echo "Starting server..."
echo "========================================"
echo

# Open browser (if GUI is available)
if command -v xdg-open &> /dev/null
then
    sleep 3 && xdg-open http://localhost:5000 &
fi

# Start app
python3 app.py