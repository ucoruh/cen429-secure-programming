# -*- coding: utf-8 -*-
# CEN429 - Hafta 5 - Demo 1: SQL enjeksiyonu (Python, yerlesik sqlite3)
#
# Bu program HIC INDIRME GEREKTIRMEZ: sqlite3 Python ile birlikte gelir.
# Demo klasorunde 'cikti/demo.db' adinda kucuk bir veritabani kurar, sonra
# ayni girisi iki yolla calistirir:
#   1) KOTU  : kullanici girdisini SQL metnine dize birlestirerek gomer.
#   2) IYI   : parametreli sorgu (soru isareti) kullanir; girdi yalnizca DEGER.
#
# Saldiri yalnizca bu demonun kendi veritabanina yapilir; hicbir sistem
# dosyasina dokunulmaz, ag kullanilmaz.  Butun degerler sentetiktir.
import os
import sqlite3
import sys

BURASI = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(BURASI, "cikti")
DBYOLU = os.path.join(CIKTI, "demo.db")


def cizgi():
    print("-" * 62)


def veritabani_kur():
    """Sifirdan kucuk bir kullanici tablosu olustur (sentetik veriler)."""
    if os.path.isdir(CIKTI):
        # Onceki calismalardan kalan veritabanini temizle.
        if os.path.isfile(DBYOLU):
            os.remove(DBYOLU)
    else:
        os.makedirs(CIKTI)
    db = sqlite3.connect(DBYOLU)
    db.execute(
        "CREATE TABLE kullanici ("
        " id INTEGER PRIMARY KEY,"
        " ad TEXT,"
        " parola TEXT,"
        " rol TEXT,"
        " gizli_not TEXT)"
    )
    db.executemany(
        "INSERT INTO kullanici (ad, parola, rol, gizli_not) VALUES (?,?,?,?)",
        [
            ("ayse", "parola123", "kullanici", "Ayse ozel notu"),
            ("mehmet", "1234", "kullanici", "Mehmet ozel notu"),
            ("admin", "S3cr3t-Admin", "yonetici", "Yonetici gizli anahtari"),
        ],
    )
    db.commit()
    return db


def giris_kotu(db, ad, parola):
    """KOTU: girdiyi dogrudan SQL metnine gomer (dize birlestirme)."""
    sorgu = (
        "SELECT id, ad, rol FROM kullanici "
        "WHERE ad = '" + ad + "' AND parola = '" + parola + "'"
    )
    print("   Uretilen SQL:")
    print("   " + sorgu)
    try:
        satirlar = db.execute(sorgu).fetchall()
    except sqlite3.Error as hata:
        print("   (SQL hatasi: " + str(hata) + ")")
        return []
    return satirlar


def giris_guvenli(db, ad, parola):
    """IYI: parametreli sorgu; girdi asla komutun bir parcasi olamaz."""
    sorgu = "SELECT id, ad, rol FROM kullanici WHERE ad = ? AND parola = ?"
    print("   Uretilen SQL (sablon):")
    print("   " + sorgu + "   [degerler ayrica gonderilir]")
    return db.execute(sorgu, (ad, parola)).fetchall()


def sonuc_yaz(satirlar):
    if not satirlar:
        print("   -> Sonuc yok. GIRIS REDDEDILDI.")
        return
    print("   -> " + str(len(satirlar)) + " satir dondu. GIRIS BASARILI:")
    for s in satirlar:
        print("      id=" + str(s[0]) + " ad=" + s[1] + " rol=" + s[2])


def main():
    db = veritabani_kur()

    cizgi()
    print("ADIM 1 - Durust kullanici: ad='ayse' parola='parola123'")
    print("[KOTU YOL]")
    sonuc_yaz(giris_kotu(db, "ayse", "parola123"))
    print("[IYI YOL]")
    sonuc_yaz(giris_guvenli(db, "ayse", "parola123"))

    cizgi()
    print("ADIM 2 - SALDIRI: parola alanina  ' OR '1'='1  yaziliyor")
    saldirgan_parola = "' OR '1'='1"
    print("[KOTU YOL]  <-- parolayi bilmeden giris bekleniyor")
    sonuc_yaz(giris_kotu(db, "ayse", saldirgan_parola))
    print("   ^ Parola bilinmeden giris yapildi: sorgu yapisi degisti.")
    print("[IYI YOL]")
    sonuc_yaz(giris_guvenli(db, "ayse", saldirgan_parola))
    print("   ^ Girdi bir DEGER olarak arandi; oyle bir parola yok: RED.")

    cizgi()
    print("ADIM 3 - SALDIRI: ad alanindan yonetici satirini cekme")
    print("         ad =  ' OR rol='yonetici' --")
    saldirgan_ad = "' OR rol='yonetici' --"
    print("[KOTU YOL]")
    sonuc_yaz(giris_kotu(db, saldirgan_ad, "farketmez"))
    print("   ^ Baska kullanicinin (yonetici) satiri sizdirildi.")
    print("[IYI YOL]")
    sonuc_yaz(giris_guvenli(db, saldirgan_ad, "farketmez"))
    print("   ^ Boyle bir ad yok: sizinti yok.")

    cizgi()
    print("ADIM 4 - Neden 'kacislama' (escaping) tek basina yetmez?")
    print("   Naif cozum: tek tirnaklari ikile ( ' -> '' ).")
    print("   Ama girdi bir SAYI baglaminda ise (tirnaksiz) ise yaramaz;")
    print("   ayrica farkli veritabanlarinda kacis kurallari degisir.")
    print("   Dogru cozum HER ZAMAN parametreli sorgudur (soru isareti).")

    db.close()
    cizgi()
    print("Sonuc: Girdiyi SQL metnine GOMME. Parametreli sorgu kullan;")
    print("boylece girdi asla komutun yapisini degistiremez.")


if __name__ == "__main__":
    sys.exit(main())
