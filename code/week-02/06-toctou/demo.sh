#!/bin/sh
# CEN429 — Hafta 2 — Demo 6: TOCTOU yaris durumu (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Her sey demo klasorundeki calisma/ altinda olur; sistem dosyalarina dokunulmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/yaz" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 — GUVENSIZ surum: once denetle, sonra ac (yaris acigi)"
sh saldiri.sh guvensiz
cizgi; echo "ADIM 2 — GUVENLI surum: O_NOFOLLOW ile tek adimda ac"
sh saldiri.sh guvenli
cizgi; echo "Sonuc: Denetim (lstat) ile kullanim (fopen) arasindaki bosluk"
echo "saldirganin girebilecegi bir yaristir. Cozum: denetim ve kullanimi"
echo "tek atomik adimda yapmak (O_NOFOLLOW, O_EXCL, ...)."
