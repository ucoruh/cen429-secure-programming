#!/bin/sh
# CEN429 - Week 5 - Demo 5: code obfuscation (Linux / WSL).
# The main part (string hiding + reflection) needs NO DOWNLOAD.
# For the optional ProGuard part run first: sh prepare.sh
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo "JDK not found (javac missing)."
    echo "Install: sudo apt-get install -y openjdk-17-jdk-headless"
    exit 1
fi
line() { echo "=============================================================="; }
rm -rf output; mkdir -p bin output
javac --release 17 -d bin PlainConstant.java HiddenConstant.java \
    DirectCall.java ReflectionCall.java || { echo "Compile error"; exit 1; }

line; echo "PART A - Static string hiding (plain vs XOR-hidden)"; line
echo "Run-time output (both produce the same string):"
java -cp bin PlainConstant
java -cp bin HiddenConstant
echo
echo "javap: the PLAIN constant shows up in the bytecode as plain text ->"
javap -c -p -cp bin PlainConstant | grep -i "server-key" | sed 's/^/   /'
echo "javap: the same string is SEARCHED FOR in the HIDDEN constant (should not be found) ->"
if javap -c -p -cp bin HiddenConstant | grep -qi "server-key"; then
    echo "   (unexpected: the string showed up)"
else
    echo "   NOT FOUND: the string is only embedded as a byte array (good)."
fi

line; echo "PART B - Hiding a method call via reflection"; line
java -cp bin DirectCall
java -cp bin ReflectionCall
echo
echo "javap: the DIRECT call shows 'invokestatic hiddenOperation' ->"
javap -c -p -cp bin DirectCall | grep -i "Method hiddenOperation" | sed 's/^/   /'
echo "javap: REFLECTION has NO direct call; only getDeclaredMethod/invoke show up ->"
if javap -c -p -cp bin ReflectionCall | grep -qi "invokestatic.*hiddenOperation"; then
    echo "   (unexpected: a direct call showed up)"
else
    echo "   No direct 'invokestatic hiddenOperation' call."
    javap -c -p -cp bin ReflectionCall | grep -iE "getDeclaredMethod|invoke:" \
        | sed 's/^/   /'
fi
echo "   NOTE (honestly): the method is STILL defined in the class (javap -p lists it);"
echo "   reflection hides the 'call link', it is not protection by itself."

line; echo "PART C - Shrinking + obfuscating with ProGuard (optional)"; line
if [ ! -f lib/proguard.jar ]; then
    echo "ProGuard not present. To enable it: sh prepare.sh"
    echo "Rule table and -keep examples: README.md and the lecture page."
    exit 0
fi
( cd bin && jar --create --file ../output/sample.jar . )
echo "Running ProGuard (proguard.pro)..."
java -jar lib/proguard.jar @proguard.pro 2>&1 | tail -3
echo "BEFORE (members):"
javap -p -cp output/sample.jar DirectCall | sed 's/^/   /'
mkdir -p output/plain && ( cd output/plain && jar -xf ../sample-obfuscated.jar )
echo "AFTER (the unused private member was removed by shrinking):"
javap -p -cp output/plain DirectCall | sed 's/^/   /'
echo "The -keep rule protected 'main'; 'hiddenOperation' was shrunk/inlined away."
