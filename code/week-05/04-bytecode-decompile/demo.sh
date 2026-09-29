#!/bin/sh
# CEN429 - Week 5 - Demo 4: bytecode and decompiling (Linux / WSL).
# NO DOWNLOAD REQUIRED; only the JDK's own javac and javap tools are used.
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK not found (javac missing)."
    echo "Install: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi
line() { echo "=============================================================="; }
mkdir -p bin
javac --release 17 -d bin LicenseCheck.java || { echo "Compile error"; exit 1; }

line; echo "STEP 1 - The program runs normally (with a wrong PIN)"; line
java -cp bin LicenseCheck 1234

line; echo "STEP 2 - 'javap -p': private field and method NAMES are visible"; line
javap -p -cp bin LicenseCheck

line; echo "STEP 3 - 'javap -c -p': the constant STRINGS and logic are visible"; line
echo "(WITHOUT the source code, from the .class file alone)"
javap -c -p -cp bin LicenseCheck | grep -E "String|pinCorrect|licenseValid|boolean"

line
echo "Result: 'javac' output is reversible. PIN='4729' and the license key"
echo "stand in plain sight in the bytecode; the method names give the logic away."
echo "Demo 5 will make this harder with string hiding + reflection."
