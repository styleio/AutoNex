#!/bin/bash

echo "========================================"
echo "AutoNex Setup for Raspberry Pi"
echo "========================================"
echo

# Virtual environment name
VENV_NAME="venv"

# Check Python
if ! command -v python3 &> /dev/null
then
    echo "Python3 not found. Installing..."
    echo
    
    # Update package list
    sudo apt update
    
    # Install Python3, pip, venv, and dev packages
    sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential
    
    if [ $? -ne 0 ]; then
        echo
        echo "ERROR: Failed to install Python3"
        echo "Please check your internet connection and try again."
        exit 1
    fi
else
    echo "Python3 detected successfully."
    python3 --version
    
    # Install python3-venv if not already installed
    if ! dpkg -l | grep -q python3-venv; then
        echo "Installing python3-venv..."
        sudo apt install -y python3-venv python3-dev build-essential
    fi
fi

echo

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv $VENV_NAME

if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Failed to create virtual environment"
    echo "Make sure python3-venv is installed:"
    echo "  sudo apt install -y python3-venv"
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source $VENV_NAME/bin/activate

# Upgrade pip, setuptools and wheel first
echo "Upgrading pip, setuptools, and wheel..."
$VENV_NAME/bin/pip install --upgrade pip setuptools wheel

# Check if requirements_raspberrypi.txt exists, otherwise use requirements.txt
if [ -f "requirements_raspberrypi.txt" ]; then
    REQUIREMENTS_FILE="requirements_raspberrypi.txt"
else
    REQUIREMENTS_FILE="requirements.txt"
fi

# Install packages from requirements file
echo
echo "Installing required packages from $REQUIREMENTS_FILE..."
echo "This may take a few minutes..."
echo
$VENV_NAME/bin/pip install --no-cache-dir -r $REQUIREMENTS_FILE

if [ $? -ne 0 ]; then
    echo
    echo "========================================"
    echo "ERROR: Some packages failed to install"
    echo "========================================"
    echo
    echo "Try running these commands:"
    echo "  sudo apt update"
    echo "  sudo apt install -y python3-dev build-essential"
    echo "  sudo apt install -y libssl-dev libffi-dev"
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
$VENV_NAME/bin/python app.py