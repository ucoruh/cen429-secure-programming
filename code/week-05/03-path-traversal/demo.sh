#!/bin/sh
# CEN429 - Week 5 - Demo 3: path traversal (Linux / WSL). NO DOWNLOAD REQUIRED.
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
rm -rf output
line() { echo "=============================================================="; }

line; echo "PART A - Python (pathlib)"; line
if command -v "$PY" >/dev/null 2>&1; then
    "$PY" path_traversal.py
else
    echo "Python 3 not found (sudo apt-get install -y python3); Python part skipped."
fi

echo
line; echo "PART B - Java (java.nio.file)"; line
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK not found (javac missing). Skipping the Java part."
    echo "Install: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 0
fi
rm -rf output
mkdir -p bin
javac --release 17 -d bin PathDemo.java || { echo "Compile error"; exit 1; }
java -cp bin PathDemo
