#!/bin/sh
# CEN429 - Hafta 5 - Demo 7: Guvenli seri durumdan cikarma (Linux / WSL).
# INDIRME GEREKTIRMEZ; yalnizca JDK gerekir.
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK bulunamadi (javac yok)."
    echo "Kurulum: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi
mkdir -p bin
javac --release 17 -d bin SeriDemo.java || { echo "Derleme hatasi"; exit 1; }
java -cp bin SeriDemo
