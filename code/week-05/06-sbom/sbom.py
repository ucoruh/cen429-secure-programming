# -*- coding: utf-8 -*-
# CEN429 - Hafta 5 - Demo 6: Yazilim Malzeme Listesi (SBOM) uretimi
#
# Demo, kendi olusturdugu sentetik jar'lardan (cikti/lib/) bir CycloneDX 1.5
# JSON SBOM'u uretir: her bilesen icin ad, surum, purl ve SHA-256. Ardindan
# kucuk, SENTETIK bir "bilinen zafiyetli surumler" listesiyle eslestirip uyarir.
#
# HIC INDIRME GEREKTIRMEZ (yerlesik zipfile, hashlib, json). Butun bilesen adlari
# ve surumleri sentetiktir; gercek bir kutuphane/CVE degildir. Gercek olay
# (Log4Shell, 2021) yalnizca README ve ders sayfasinda ANLATILIR.
import hashlib
import json
import os
import sys
import zipfile

BURASI = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(BURASI, "cikti")
LIBDIR = os.path.join(CIKTI, "lib")
SBOM = os.path.join(CIKTI, "sbom.cyclonedx.json")

# Sentetik bilesenler: (grup, ad, surum). Hepsi uydurma.
BILESENLER = [
    ("ornek.grup", "kayit-kutuphanesi", "1.2.0"),
    ("ornek.grup", "json-arac", "2.5.1"),
    ("ornek.grup", "gunluk-cekirdek", "2.14.0"),
    ("ornek.grup", "sifreleme-yardimci", "3.0.4"),
]

# Sentetik "bilinen zafiyetli surumler" listesi (gercek CVE degil).
ZAFIYETLI = {
    "gunluk-cekirdek": {
        "surumler": ["2.0.0", "2.14.0", "2.15.0"],
        "id": "CEN429-2026-0001",
        "aciklama": "Bicimli mesajda uzaktan kod calistirma (sentetik ornek).",
        "duzeltilen": "2.17.1",
    },
    "json-arac": {
        "surumler": ["2.5.1"],
        "id": "CEN429-2026-0002",
        "aciklama": "Guvensiz seri durumdan cikarma (sentetik ornek).",
        "duzeltilen": "2.6.0",
    },
}


def cizgi():
    print("-" * 62)


def jar_uret():
    """Sentetik jar dosyalari olustur (her biri kucuk bir zip)."""
    if not os.path.isdir(LIBDIR):
        os.makedirs(LIBDIR)
    for grup, ad, surum in BILESENLER:
        yol = os.path.join(LIBDIR, ad + "-" + surum + ".jar")
        manifest = (
            "Manifest-Version: 1.0\r\n"
            "Implementation-Title: " + ad + "\r\n"
            "Implementation-Version: " + surum + "\r\n"
            "Implementation-Vendor-Id: " + grup + "\r\n\r\n"
        )
        with zipfile.ZipFile(yol, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("META-INF/MANIFEST.MF", manifest)
            # Icerik farkli olsun diye kucuk bir yer tutucu sinif dosyasi.
            z.writestr("ornek/Sinif.txt", "sentetik icerik: " + ad + surum)


def sha256(yol):
    h = hashlib.sha256()
    with open(yol, "rb") as f:
        for parca in iter(lambda: f.read(65536), b""):
            h.update(parca)
    return h.hexdigest()


def manifesten_oku(yol):
    """Jar manifest'inden ad ve surumu oku (yoksa dosya adindan cikar)."""
    ad, surum, grup = None, None, "ornek.grup"
    try:
        with zipfile.ZipFile(yol) as z:
            metin = z.read("META-INF/MANIFEST.MF").decode("utf-8", "replace")
        for satir in metin.splitlines():
            if satir.startswith("Implementation-Title:"):
                ad = satir.split(":", 1)[1].strip()
            elif satir.startswith("Implementation-Version:"):
                surum = satir.split(":", 1)[1].strip()
            elif satir.startswith("Implementation-Vendor-Id:"):
                grup = satir.split(":", 1)[1].strip()
    except (KeyError, zipfile.BadZipFile):
        pass
    if not ad or not surum:
        taban = os.path.basename(yol)[:-4]
        ad, _, surum = taban.rpartition("-")
    return grup, ad, surum


def sbom_uret():
    bilesenler = []
    for dosya in sorted(os.listdir(LIBDIR)):
        if not dosya.endswith(".jar"):
            continue
        yol = os.path.join(LIBDIR, dosya)
        grup, ad, surum = manifesten_oku(yol)
        ozet = sha256(yol)
        purl = "pkg:maven/" + grup + "/" + ad + "@" + surum
        bilesenler.append({
            "type": "library",
            "group": grup,
            "name": ad,
            "version": surum,
            "purl": purl,
            "hashes": [{"alg": "SHA-256", "content": ozet}],
        })
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "version": 1,
        "metadata": {"component": {
            "type": "application",
            "name": "cen429-ornek-uygulama",
            "version": "0.1.0",
        }},
        "components": bilesenler,
    }
    with open(SBOM, "w", encoding="utf-8") as f:
        json.dump(bom, f, ensure_ascii=False, indent=2)
    return bilesenler


def zafiyet_tara(bilesenler):
    bulgular = []
    for b in bilesenler:
        kayit = ZAFIYETLI.get(b["name"])
        if kayit and b["version"] in kayit["surumler"]:
            bulgular.append((b, kayit))
    return bulgular


def main():
    jar_uret()
    bilesenler = sbom_uret()

    cizgi()
    print("ADIM 1 - lib/ altindaki jar'lardan CycloneDX 1.5 SBOM uretildi")
    print("   Cikti: " + os.path.relpath(SBOM, BURASI))
    print("   " + str(len(bilesenler)) + " bilesen bulundu:")
    print("   %-22s %-8s %s" % ("ad", "surum", "SHA-256 (ilk 16)"))
    for b in bilesenler:
        print("   %-22s %-8s %s..." % (
            b["name"], b["version"], b["hashes"][0]["content"][:16]))

    cizgi()
    print("ADIM 2 - purl (paket URL) ornekleri")
    for b in bilesenler:
        print("   " + b["purl"])

    cizgi()
    print("ADIM 3 - Bilinen (sentetik) zafiyetli surumlerle eslestirme")
    bulgular = zafiyet_tara(bilesenler)
    if not bulgular:
        print("   Uyari yok.")
    for b, k in bulgular:
        print("   [UYARI] " + b["name"] + " " + b["version"]
              + "  (" + k["id"] + ")")
        print("           " + k["aciklama"])
        print("           Cozum: >= " + k["duzeltilen"] + " surumune yukselt.")

    cizgi()
    print("Sonuc: SBOM (CycloneDX/SPDX), 'hangi bilesen hangi surumde' sorusuna")
    print("makine-okur cevaptir. Zafiyet veritabanlariyla eslesince, bir sonraki")
    print("Log4Shell'de saniyeler icinde 'etkilendim mi?' yanitini verir.")


if __name__ == "__main__":
    sys.exit(main())
