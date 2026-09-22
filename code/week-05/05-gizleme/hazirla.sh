#!/bin/sh
# CEN429 - Hafta 5 - Demo 5: istege bagli ProGuard'i indirir.
# Resmi surumu (zip) SABIT surum + SHA-256 dogrulamasiyla indirir ve icinden
# yalnizca lib/proguard.jar dosyasini lib/ altina cikarir.
# Ana demo (dize gizleme + yansima) bunsuz da calisir; *.jar depoya girmez.
cd "$(dirname "$0")"
SURUM="7.4.2"
ZIP="proguard-$SURUM.zip"
URL="https://github.com/Guardsquare/proguard/releases/download/v$SURUM/$ZIP"
SHA="164b26a6ca655296bede9b1474ee47e24369d59860fdcebaa64d210221bce5fa"
mkdir -p lib
if [ -f "lib/proguard.jar" ]; then echo "Zaten var: lib/proguard.jar"; exit 0; fi
echo "Indiriliyor (~32 MB): $URL"
if command -v curl >/dev/null 2>&1; then
    curl -sSL -o "lib/$ZIP" "$URL" || { echo "Indirme basarisiz."; exit 1; }
elif command -v wget >/dev/null 2>&1; then
    wget -qO "lib/$ZIP" "$URL" || { echo "Indirme basarisiz."; exit 1; }
else
    echo "curl ya da wget gerekli."; exit 1
fi
GELEN=$(sha256sum "lib/$ZIP" | cut -d' ' -f1)
if [ "$GELEN" != "$SHA" ]; then
    echo "SHA-256 UYUSMADI! Beklenen: $SHA"
    echo "                   Gelen   : $GELEN"
    rm -f "lib/$ZIP"; exit 1
fi
echo "Dogrulandi (SHA-256 tuttu)."
( cd lib && unzip -oq "$ZIP" "proguard-$SURUM/lib/proguard.jar" \
    && mv "proguard-$SURUM/lib/proguard.jar" proguard.jar \
    && rm -rf "proguard-$SURUM" "$ZIP" )
echo "Hazir: lib/proguard.jar  ->  simdi: sh demo.sh"
