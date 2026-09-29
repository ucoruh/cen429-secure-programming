#!/bin/sh
# CEN429 - Week 5 - Demo 1: SQL injection (Linux / WSL)
# The main demo runs with Python's built-in sqlite3 module (NO DOWNLOAD).
# For the optional Java (JDBC) section run first: sh prepare.sh  (downloads sqlite-jdbc).
cd "$(dirname "$0")"
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "Python 3 is required: sudo apt-get install -y python3"; exit 1; }
line() { echo "=============================================================="; }

line; echo "PART A - Python + sqlite3 (no download required)"; line
"$PY" sql_injection.py

echo
line; echo "PART B - Java + JDBC (PreparedStatement) - optional"; line
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK not found (javac missing). Skipping the Java part."
    echo "Install: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 0
fi
JAR=$(ls lib/sqlite-jdbc-*.jar 2>/dev/null | head -n 1)
mkdir -p bin
javac --release 17 -d bin SqlDemo.java || { echo "Compile error"; exit 1; }
if [ -n "$JAR" ]; then
    echo "Driver found: $JAR"
    java -cp "bin:$JAR" SqlDemo
else
    echo "SQLite JDBC driver missing (lib/ is empty)."
    echo "To run the Java part first:  sh prepare.sh"
    echo "(SqlDemo.java was compiled; the Python demo already showed the result.)"
fi
