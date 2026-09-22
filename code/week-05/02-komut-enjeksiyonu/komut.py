# -*- coding: utf-8 -*-
# CEN429 - Hafta 5 - Demo 2: Komut enjeksiyonu (Python)
#
#   KOTU  : subprocess ... shell=True  ->  girdi kabuga metin olarak gider;
#           ;  ya da  &  ek komut baslatir.
#   IYI   : subprocess ... [arguman listesi]  ->  kabuk yok; girdi tek arguman.
#
# Enjekte edilen komut yalnizca ZARARSIZ bir mesaj basar. Hicbir dosya
# silinmez/degistirilmez; ag kullanilmaz. INDIRME GEREKTIRMEZ.
import os
import re
import subprocess
import sys

WINDOWS = os.name == "nt"
IZINLI = re.compile(r"^[A-Za-z0-9_]+$")


def cizgi():
    print("-" * 62)


def ciktiyaz(tamamlanan):
    for satir in (tamamlanan.stdout or "").splitlines():
        print("   | " + satir)


def calistir_kotu(ad):
    # Selamlamayi kabuk uzerinden 'echo' ile kuruyoruz (dize birlestirme).
    if WINDOWS:
        tam = "echo ARAC CIKTISI: Merhaba " + ad
    else:
        tam = 'echo "ARAC CIKTISI: Merhaba" ' + ad
    print("   Kabuga giden komut:")
    print("   " + tam)
    ciktiyaz(subprocess.run(tam, shell=True, capture_output=True, text=True))


def calistir_guvenli(ad):
    if not IZINLI.match(ad):
        print("   Izin listesi REDDETTI (^[A-Za-z0-9_]+$):")
        print("   girdi = " + ad)
        print("   -> Program hic calistirilmadi.")
        return
    # Kabuk YOK: gercek bir program + arguman listesi. Girdi tek arguman.
    cmd = [sys.executable, "-c",
           "import sys; print('ARAC CIKTISI: Merhaba', sys.argv[1])", ad]
    print("   Arguman listesi:")
    print("   [python, -c, ...] ... '" + ad + "'")
    ciktiyaz(subprocess.run(cmd, capture_output=True, text=True))


def main():
    sep = "& " if WINDOWS else "; "
    zararsiz = "echo SIZDI-KOMUT-ENJEKSIYONU"

    cizgi()
    print("ADIM 1 - Durust girdi: ad = 'Ayse'")
    print("[KOTU YOL]")
    calistir_kotu("Ayse")
    print("[IYI YOL]")
    calistir_guvenli("Ayse")

    cizgi()
    print("ADIM 2 - SALDIRI: ad iceriginde ek komut var")
    kotu_ad = "Ayse " + sep + zararsiz
    print("   ad = " + kotu_ad)
    print("[KOTU YOL]  <-- kabuk ikinci komutu da calistirir")
    calistir_kotu(kotu_ad)
    print("   ^ 'SIZDI...' satiri = enjekte edilen komut kostu.")
    print("[IYI YOL]  <-- ayni girdi zararsiz bir metin olur")
    calistir_guvenli(kotu_ad)
    print("   ^ Izin listesi bosluk/;/& gordu ve reddetti.")

    cizgi()
    print("Sonuc: shell=True + dize birlestirme TEHLIKELI. Arguman listesi")
    print("(shell=False) + izin listesi kullan.")


if __name__ == "__main__":
    sys.exit(main())
