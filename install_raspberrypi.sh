#!/bin/bash
set -e

echo "========================================"
echo "AutoNex Setup for Raspberry Pi"
echo "========================================"
echo

VENV_NAME="venv"

# --- 前提パッケージ（BLAS/LAPACK など） ---
echo "[STEP] Installing system libraries (OpenBLAS/LAPACK, build tools)"
sudo apt update
sudo apt install -y \
  python3 python3-pip python3-venv python3-dev build-essential \
  libopenblas0-pthread liblapack3

# --- Python3 確認 ---
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found after install. Please check your apt sources."
  exit 1
fi

echo "Python3 detected successfully."
python3 --version
echo

# --- venv 作成 ---
echo "[STEP] Creating virtual environment..."
python3 -m venv "$VENV_NAME" || {
  echo
  echo "ERROR: Failed to create virtual environment."
  echo "Try: sudo apt install -y python3-venv"
  exit 1
}
echo

# --- venv 有効化 ---
echo "[STEP] Activating virtual environment..."
# shellcheck disable=SC1090
source "$VENV_NAME/bin/activate"
echo

# --- 衝突チェック：カレントに numpy という名前が無いか ---
if [ -e "./numpy" ]; then
  echo "ERROR: Found './numpy' (file or directory)."
  echo "This breaks 'import numpy'. Please rename or remove it and rerun."
  exit 1
fi

# --- pip/toolchain 更新 ---
echo "[STEP] Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel
echo

# --- 先に NumPy 1.x を固定インストール（OpenCV などより前） ---
echo "[STEP] Pinning NumPy to 1.x (1.26.4)..."
pip install --no-cache-dir "numpy<2,>=1.26.4"
echo

# --- requirements ファイル決定 ---
if [ -f "requirements_raspberrypi.txt" ]; then
  REQUIREMENTS_FILE="requirements_raspberrypi.txt"
else
  REQUIREMENTS_FILE="requirements.txt"
fi

echo "[STEP] Installing required packages from ${REQUIREMENTS_FILE}..."
# 既存の NumPy を尊重しつつ他を入れる（デフォルトで only-if-needed だが明示）
pip install --no-cache-dir --upgrade --upgrade-strategy only-if-needed -r "$REQUIREMENTS_FILE"
echo

echo "========================================"
echo "Setup completed!"
echo "Starting server..."
echo "========================================"
echo

# GUI 環境があればブラウザオープン
if command -v xdg-open &>/dev/null; then
  (sleep 3 && xdg-open http://localhost:5000) &
fi

# アプリ起動
exec "$VENV_NAME/bin/python" app.py
