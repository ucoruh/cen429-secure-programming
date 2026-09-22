#!/bin/sh
# CEN429 - Hafta 5 - Demo 3: Yol gecisi (Linux / WSL). INDIRME GEREKTIRMEZ.
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
rm -rf cikti
cizgi() { echo "=============================================================="; }

cizgi; echo "BOLUM A - Python (pathlib)"; cizgi
if command -v "$PY" >/dev/null 2>&1; then
    "$PY" yol.py
else
    echo "Python 3 yok (sudo apt-get install -y python3); Python bolumu atlandi."
fi

echo
cizgi; echo "BOLUM B - Java (java.nio.file)"; cizgi
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK bulunamadi (javac yok). Java bolumu atlaniyor."
    echo "Kurulum: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 0
fi
rm -rf cikti
mkdir -p bin
javac --release 17 -d bin YolDemo.java || { echo "Derleme hatasi"; exit 1; }
java -cp bin YolDemo
