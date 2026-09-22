#!/bin/sh
# CEN429 - Hafta 5 - Demo 1: SQL enjeksiyonu (Linux / WSL)
# Ana demo Python'un yerlesik sqlite3 modulu ile calisir (INDIRME YOK).
# Istege bagli Java (JDBC) bolumu icin: sh hazirla.sh  (sqlite-jdbc indirir).
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "Python 3 gerekli: sudo apt-get install -y python3"; exit 1; }
cizgi() { echo "=============================================================="; }

cizgi; echo "BOLUM A - Python + sqlite3 (indirme gerektirmez)"; cizgi
"$PY" sqli.py

echo
cizgi; echo "BOLUM B - Java + JDBC (PreparedStatement) - istege bagli"; cizgi
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK bulunamadi (javac yok). Java bolumu atlaniyor."
    echo "Kurulum: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 0
fi
JAR=$(ls lib/sqlite-jdbc-*.jar 2>/dev/null | head -n 1)
mkdir -p bin
javac --release 17 -d bin SqlDemo.java || { echo "Derleme hatasi"; exit 1; }
if [ -n "$JAR" ]; then
    echo "Surucu bulundu: $JAR"
    java -cp "bin:$JAR" SqlDemo
else
    echo "SQLite JDBC surucusu yok (lib/ bos)."
    echo "Java bolumunu calistirmak icin once:  sh hazirla.sh"
    echo "(SqlDemo.java derlendi; Python demosu zaten sonucu gosterdi.)"
fi
