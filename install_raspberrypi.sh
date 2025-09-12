#!/bin/bash
set -e

echo "========================================"
echo "AutoNex Setup for Raspberry Pi"
echo "========================================"
echo

VENV_NAME="venv"

# --- �O��p�b�P�[�W�iBLAS/LAPACK �Ȃǁj ---
echo "[STEP] Installing system libraries (OpenBLAS/LAPACK, build tools)"
sudo apt update
sudo apt install -y \
  python3 python3-pip python3-venv python3-dev build-essential \
  libopenblas0-pthread liblapack3

# --- Python3 �m�F ---
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found after install. Please check your apt sources."
  exit 1
fi

echo "Python3 detected successfully."
python3 --version
echo

# --- venv �쐬 ---
echo "[STEP] Creating virtual environment..."
python3 -m venv "$VENV_NAME" || {
  echo
  echo "ERROR: Failed to create virtual environment."
  echo "Try: sudo apt install -y python3-venv"
  exit 1
}
echo

# --- venv �L���� ---
echo "[STEP] Activating virtual environment..."
# shellcheck disable=SC1090
source "$VENV_NAME/bin/activate"
echo

# --- �Փ˃`�F�b�N�F�J�����g�� numpy �Ƃ������O�������� ---
if [ -e "./numpy" ]; then
  echo "ERROR: Found './numpy' (file or directory)."
  echo "This breaks 'import numpy'. Please rename or remove it and rerun."
  exit 1
fi

# --- pip/toolchain �X�V ---
echo "[STEP] Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel
echo

# --- ��� NumPy 1.x ���Œ�C���X�g�[���iOpenCV �Ȃǂ��O�j ---
echo "[STEP] Pinning NumPy to 1.x (1.26.4)..."
pip install --no-cache-dir "numpy<2,>=1.26.4"
echo

# --- requirements �t�@�C������ ---
if [ -f "requirements_raspberrypi.txt" ]; then
  REQUIREMENTS_FILE="requirements_raspberrypi.txt"
else
  REQUIREMENTS_FILE="requirements.txt"
fi

echo "[STEP] Installing required packages from ${REQUIREMENTS_FILE}..."
# ������ NumPy �𑸏d����������i�f�t�H���g�� only-if-needed ���������j
pip install --no-cache-dir --upgrade --upgrade-strategy only-if-needed -r "$REQUIREMENTS_FILE"
echo

echo "========================================"
echo "Setup completed!"
echo "Starting server..."
echo "========================================"
echo

# GUI ��������΃u���E�U�I�[�v��
if command -v xdg-open &>/dev/null; then
  (sleep 3 && xdg-open http://localhost:5000) &
fi

# �A�v���N��
exec "$VENV_NAME/bin/python" app.py
