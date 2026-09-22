# -*- coding: utf-8 -*-
# CEN429 - Hafta 5 - Demo 3: Yol gecisi / path traversal (Python, pathlib)
#
#   KOTU  : istek dogrudan koke eklenir; ../gizli.txt kokun DISINA cikar.
#   IYI   : yol .resolve() ile kanoniklestirilir ve kokun ICINDE oldugu
#           dogrulanir (Path.is_relative_to); mutlak yol reddedilir.
#
# TUM dosyalar demo klasorundeki cikti/ altinda uretilir; demo klasorunun
# disina asla cikilmaz. INDIRME GEREKTIRMEZ.
import os
import sys
from pathlib import Path

BURASI = Path(__file__).resolve().parent
TABAN = BURASI / "cikti"
KOK = TABAN / "veri"
GIZLI = TABAN / "gizli.txt"


def cizgi():
    print("-" * 62)


def hazirla():
    KOK.mkdir(parents=True, exist_ok=True)
    (KOK / "rapor.txt").write_text(
        "Herkese acik rapor (sentetik).\n", encoding="utf-8")
    GIZLI.write_text(
        "GIZLI: sentetik yonetici notu (kok disinda).\n", encoding="utf-8")


def oku_kotu(istek):
    # Hicbir denetim yok. Istek koke eklenir ve okunur.
    hedef = KOK / istek
    try:
        icerik = hedef.read_text(encoding="utf-8").strip()
        print("   Cozulen yol: " + os.path.normpath(str(hedef)))
        print("   OKUNDU -> " + icerik)
    except OSError as hata:
        print("   (Okuma hatasi: " + str(hata) + ")")


def kok_icinde(aday, kok):
    # Python 3.9+: is_relative_to. Daha eski surumler icin yedek yontem.
    try:
        return aday.is_relative_to(kok)
    except AttributeError:
        return os.path.commonpath([str(aday), str(kok)]) == str(kok)


def oku_guvenli(istek):
    kok = KOK.resolve()
    if os.path.isabs(istek):
        print("   REDDEDILDI: mutlak yol / surucu harfi.")
        return
    aday = (kok / istek).resolve()
    if not kok_icinde(aday, kok):
        print("   REDDEDILDI: kok disina cikiyor -> " + str(aday))
        return
    try:
        icerik = aday.read_text(encoding="utf-8").strip()
        print("   Cozulen yol: " + str(aday))
        print("   OKUNDU -> " + icerik)
    except OSError as hata:
        print("   (Okuma hatasi: " + str(hata) + ")")


def main():
    hazirla()

    cizgi()
    print("Kok klasor (yalniz buradan sunulmali): " + str(KOK))
    print("ADIM 1 - Mesru istek: 'rapor.txt'")
    print("[KOTU YOL]")
    oku_kotu("rapor.txt")
    print("[IYI YOL]")
    oku_guvenli("rapor.txt")

    cizgi()
    print("ADIM 2 - SALDIRI: '../gizli.txt' (kok disi)")
    print("[KOTU YOL]")
    oku_kotu(os.path.join("..", "gizli.txt"))
    print("   ^ Kok disindaki gizli dosya sizdirildi.")
    print("[IYI YOL]")
    oku_guvenli(os.path.join("..", "gizli.txt"))
    print("   ^ resolve() + kok denetimi engelledi.")

    cizgi()
    print("ADIM 3 - SALDIRI: mutlak yol denemesi")
    print("[IYI YOL] istek = mutlak yol")
    kotu = "C:\\Windows" if os.name == "nt" else "/etc/hostname"
    oku_guvenli(kotu)

    cizgi()
    print("Sonuc: Kullanici yolunu koke ekleyip okuma. resolve() +")
    print("kok denetimi + mutlak yol reddi kullan.")


if __name__ == "__main__":
    sys.exit(main())
