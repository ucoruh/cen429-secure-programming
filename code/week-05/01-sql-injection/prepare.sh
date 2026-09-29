#!/bin/sh
# CEN429 - Week 5 - Demo 1: downloads the optional SQLite JDBC driver.
# Downloads it from Maven Central at a PINNED version, verified by SHA-256, into lib/.
# This file never enters the repository (*.jar is in .gitignore). The main demo
# works fine without it.
cd "$(dirname "$0")"
VERSION="3.42.0.0"
JAR="sqlite-jdbc-$VERSION.jar"
URL="https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/$VERSION/$JAR"
SHA="53174d76087bb73cc29db9c02766fb921fd7fc652f7952f3609e0018e3dd5ded"
mkdir -p lib
if [ -f "lib/$JAR" ]; then echo "Already present: lib/$JAR"; exit 0; fi
echo "Downloading: $URL"
if command -v curl >/dev/null 2>&1; then
    curl -sSL -o "lib/$JAR" "$URL" || { echo "Download failed."; exit 1; }
elif command -v wget >/dev/null 2>&1; then
    wget -qO "lib/$JAR" "$URL" || { echo "Download failed."; exit 1; }
else
    echo "curl or wget is required."; exit 1
fi
GOT=$(sha256sum "lib/$JAR" | cut -d' ' -f1)
if [ "$GOT" != "$SHA" ]; then
    echo "SHA-256 MISMATCH! Expected: $SHA"
    echo "                  Got     : $GOT"
    rm -f "lib/$JAR"; exit 1
fi
echo "Verified (SHA-256 matched): lib/$JAR"
echo "Now run: sh demo.sh"
