#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CEN429 — Hafta 2 — Demo 5: CVSS v3.1 Temel Puan hesaplayıcı

Kullanım:
    python3 cvss.py "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
    python3 cvss.py --ornekler        (hazır örnekleri çözer)

CVSS (Common Vulnerability Scoring System), bir güvenlik açığının ciddiyetini
0.0–10.0 arasında bir sayıya çevirir. Bu betik yalnız TEMEL (Base) puanı,
FIRST'ün v3.1 belgesindeki formüllerle sıfırdan hesaplar; ağ isteği yapmaz.

Metrikler:
  AV  Saldırı vektörü      N(etwork) A(djacent) L(ocal) P(hysical)
  AC  Saldırı karmaşıklığı L(ow) H(igh)
  PR  Gerekli ayrıcalık    N(one) L(ow) H(igh)
  UI  Kullanıcı etkileşimi N(one) R(equired)
  S   Kapsam (scope)       U(nchanged) C(hanged)
  C   Gizlilik etkisi      H(igh) L(ow) N(one)
  I   Bütünlük etkisi      H(igh) L(ow) N(one)
  A   Erişilebilirlik      H(igh) L(ow) N(one)
"""
import sys
import math

AV = {"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.20}
AC = {"L": 0.77, "H": 0.44}
# PR, kapsam (S) değişmişse farklı çarpanlar alır.
PR_U = {"N": 0.85, "L": 0.62, "H": 0.27}
PR_C = {"N": 0.85, "L": 0.68, "H": 0.50}
UI = {"N": 0.85, "R": 0.62}
CIA = {"H": 0.56, "L": 0.22, "N": 0.00}

ETIKET = {
    "AV": {"N": "Ag", "A": "Bitisik ag", "L": "Yerel", "P": "Fiziksel"},
    "AC": {"L": "Dusuk", "H": "Yuksek"},
    "PR": {"N": "Yok", "L": "Dusuk", "H": "Yuksek"},
    "UI": {"N": "Yok", "R": "Gerekli"},
    "S":  {"U": "Degismedi", "C": "Degisti"},
}


def yuvarla_yukari(x):
    """CVSS'e ozgu 'roundup': bir ondalik basamaga yukari yuvarla."""
    tam = int(round(x * 100000))
    if tam % 10000 == 0:
        return tam / 100000.0
    return (math.floor(tam / 10000) + 1) / 10.0


def ayristir(vektor):
    parcalar = vektor.strip().split("/")
    m = {}
    for p in parcalar:
        if ":" in p:
            k, v = p.split(":", 1)
            m[k] = v
    for gerekli in ("AV", "AC", "PR", "UI", "S", "C", "I", "A"):
        if gerekli not in m:
            raise ValueError("eksik metrik: " + gerekli)
    return m


def taban_puan(m):
    degisti = m["S"] == "C"
    pr = (PR_C if degisti else PR_U)[m["PR"]]

    # ISS: guvenlik ozelliklerinin ne kadari bozuldu
    iss = 1 - (1 - CIA[m["C"]]) * (1 - CIA[m["I"]]) * (1 - CIA[m["A"]])
    if not degisti:
        etki = 6.42 * iss
    else:
        etki = 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15

    kullanilabilirlik = 8.22 * AV[m["AV"]] * AC[m["AC"]] * pr * UI[m["UI"]]

    if etki <= 0:
        return 0.0, etki, kullanilabilirlik
    if degisti:
        taban = min(1.08 * (etki + kullanilabilirlik), 10)
    else:
        taban = min(etki + kullanilabilirlik, 10)
    return yuvarla_yukari(taban), etki, kullanilabilirlik


def derece(p):
    if p == 0.0:
        return "Yok (None)"
    if p < 4.0:
        return "Dusuk (Low)"
    if p < 7.0:
        return "Orta (Medium)"
    if p < 9.0:
        return "Yuksek (High)"
    return "Kritik (Critical)"


def cubuk(p):
    dolu = int(round(p / 10.0 * 20))
    return "#" * dolu + "." * (20 - dolu)


def coz(vektor, aciklama=""):
    try:
        m = ayristir(vektor)
    except ValueError as e:
        print("  HATA (%s): %s" % (vektor, e))
        return
    p, etki, kul = taban_puan(m)
    if aciklama:
        print("  " + aciklama)
    print("  %s" % vektor)
    ozet = "AV=%s AC=%s PR=%s UI=%s S=%s | C=%s I=%s A=%s" % (
        ETIKET["AV"][m["AV"]], ETIKET["AC"][m["AC"]], ETIKET["PR"][m["PR"]],
        ETIKET["UI"][m["UI"]], ETIKET["S"][m["S"]], m["C"], m["I"], m["A"])
    print("    " + ozet)
    print("    Etki=%.1f  Kullanilabilirlik=%.1f" % (etki, kul))
    print("    TEMEL PUAN = %.1f  |%s|  %s\n" % (p, cubuk(p), derece(p)))


ORNEKLER = [
    ("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
     "1) Uzaktan, kimlik gerektirmeyen tam ele gecirme (Heartbleed benzeri agirlik)"),
    ("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
     "2) Ayni ama KAPSAM degisti (kutu disina cikan etki) -> daha yuksek"),
    ("CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N",
     "3) Zor kosullar, yetki+etkilesim gerek, yalniz sinirli gizlilik -> dusuk"),
    ("CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
     "4) Yerel yetki yukseltme (cihaz saldirganin elinde) -> yuksek"),
    ("CVSS:3.1/AV:P/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N",
     "5) Fiziksel erisim + yuksek karmasiklik, yalniz gizlilik -> orta"),
]


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return
    if args[0] == "--ornekler":
        for vek, acik in ORNEKLER:
            coz(vek, acik)
        return
    for vek in args:
        coz(vek)


if __name__ == "__main__":
    main()
