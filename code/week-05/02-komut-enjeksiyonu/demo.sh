#!/bin/sh
# CEN429 - Hafta 5 - Demo 2: Komut enjeksiyonu (Linux / WSL)
# INDIRME GEREKTIRMEZ. Python bolumu her zaman calisir; Java bolumu JDK varsa.
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
cizgi() { echo "=============================================================="; }

cizgi; echo "BOLUM A - Python (subprocess: shell=True vs arguman listesi)"; cizgi
if command -v "$PY" >/dev/null 2>&1; then
    "$PY" komut.py
else
    echo "Python 3 yok (sudo apt-get install -y python3); Python bolumu atlandi."
fi

echo
cizgi; echo "BOLUM B - Java (Runtime.exec vs ProcessBuilder)"; cizgi
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK bulunamadi (javac yok). Java bolumu atlaniyor."
    echo "Kurulum: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 0
fi
mkdir -p bin
javac --release 17 -d bin Yazici.java KomutDemo.java || { echo "Derleme hatasi"; exit 1; }
java -cp bin KomutDemo
