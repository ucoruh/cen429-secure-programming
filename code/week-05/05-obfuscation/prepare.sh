#!/bin/sh
# CEN429 - Week 5 - Demo 5: downloads the optional ProGuard tool.
# Downloads the official release (zip) at a PINNED version, verified by
# SHA-256, and extracts only lib/proguard.jar into lib/.
# The main demo (string hiding + reflection) works without it; *.jar never
# enters the repository.
cd "$(dirname "$0")"
VERSION="7.4.2"
ZIP="proguard-$VERSION.zip"
URL="https://github.com/Guardsquare/proguard/releases/download/v$VERSION/$ZIP"
SHA="164b26a6ca655296bede9b1474ee47e24369d59860fdcebaa64d210221bce5fa"
mkdir -p lib
if [ -f "lib/proguard.jar" ]; then echo "Already present: lib/proguard.jar"; exit 0; fi
echo "Downloading (~32 MB): $URL"
if command -v curl >/dev/null 2>&1; then
    curl -sSL -o "lib/$ZIP" "$URL" || { echo "Download failed."; exit 1; }
elif command -v wget >/dev/null 2>&1; then
    wget -qO "lib/$ZIP" "$URL" || { echo "Download failed."; exit 1; }
else
    echo "curl or wget is required."; exit 1
fi
GOT=$(sha256sum "lib/$ZIP" | cut -d' ' -f1)
if [ "$GOT" != "$SHA" ]; then
    echo "SHA-256 MISMATCH! Expected: $SHA"
    echo "                  Got     : $GOT"
    rm -f "lib/$ZIP"; exit 1
fi
echo "Verified (SHA-256 matched)."
( cd lib && unzip -oq "$ZIP" "proguard-$VERSION/lib/proguard.jar" \
    && mv "proguard-$VERSION/lib/proguard.jar" proguard.jar \
    && rm -rf "proguard-$VERSION" "$ZIP" )
echo "Ready: lib/proguard.jar  ->  now run: sh demo.sh"
