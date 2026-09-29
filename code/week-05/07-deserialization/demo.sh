#!/bin/sh
# CEN429 - Week 5 - Demo 7: safe deserialization (Linux / WSL).
# NO DOWNLOAD REQUIRED; only the JDK is needed.
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK not found (javac missing)."
    echo "Install: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi
mkdir -p bin
javac --release 17 -d bin SerializationDemo.java || { echo "Compile error"; exit 1; }
java -cp bin SerializationDemo
