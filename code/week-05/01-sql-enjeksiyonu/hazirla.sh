#!/bin/sh
# CEN429 - Hafta 5 - Demo 1: istege bagli SQLite JDBC surucusunu indirir.
# Maven Central'dan SABIT surum + SHA-256 dogrulamasiyla lib/ altina koyar.
# Bu dosya .gitignore geregi depoya girmez (*.jar). Ana demo bunsuz da calisir.
cd "$(dirname "$0")"
SURUM="3.42.0.0"
JAR="sqlite-jdbc-$SURUM.jar"
URL="https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/$SURUM/$JAR"
SHA="53174d76087bb73cc29db9c02766fb921fd7fc652f7952f3609e0018e3dd5ded"
mkdir -p lib
if [ -f "lib/$JAR" ]; then echo "Zaten var: lib/$JAR"; exit 0; fi
echo "Indiriliyor: $URL"
if command -v curl >/dev/null 2>&1; then
    curl -sSL -o "lib/$JAR" "$URL" || { echo "Indirme basarisiz."; exit 1; }
elif command -v wget >/dev/null 2>&1; then
    wget -qO "lib/$JAR" "$URL" || { echo "Indirme basarisiz."; exit 1; }
else
    echo "curl ya da wget gerekli."; exit 1
fi
GELEN=$(sha256sum "lib/$JAR" | cut -d' ' -f1)
if [ "$GELEN" != "$SHA" ]; then
    echo "SHA-256 UYUSMADI! Beklenen: $SHA"
    echo "                   Gelen   : $GELEN"
    rm -f "lib/$JAR"; exit 1
fi
echo "Dogrulandi (SHA-256 tuttu): lib/$JAR"
echo "Simdi calistirin: sh demo.sh"
