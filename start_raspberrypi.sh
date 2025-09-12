#!/bin/bash
# 簡易版：既にPythonと必要なパッケージがインストールされている場合用

# Open browser if GUI is available
if command -v xdg-open &> /dev/null
then
    xdg-open http://localhost:5000 &
fi

# Start app
python3 app.py