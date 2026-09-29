#!/bin/sh
# CEN429 - Week 5 - Demo 2: command injection (Linux / WSL)
# NO DOWNLOAD REQUIRED. The Python part always runs; the Java part runs if a JDK is present.
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
line() { echo "=============================================================="; }

line; echo "PART A - Python (subprocess: shell=True vs argument list)"; line
if command -v "$PY" >/dev/null 2>&1; then
    "$PY" command_injection.py
else
    echo "Python 3 not found (sudo apt-get install -y python3); Python part skipped."
fi

echo
line; echo "PART B - Java (Runtime.exec vs ProcessBuilder)"; line
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK not found (javac missing). Skipping the Java part."
    echo "Install: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 0
fi
mkdir -p bin
javac --release 17 -d bin Printer.java CommandDemo.java || { echo "Compile error"; exit 1; }
java -cp bin CommandDemo
