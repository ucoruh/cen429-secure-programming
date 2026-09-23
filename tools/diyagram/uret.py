# -*- coding: utf-8 -*-
"""Bütün ders görsellerini yeniden üretir ve otomatik denetimden geçirir.

Kullanım:  py -3.12 tools/diyagram/uret.py docs

Turlama yöntemi: üret → tara → raporla. Taşan/çakışan yazılar elle aranmaz,
bu rapor gösterir. Rapor temiz çıkana kadar düzelt ve tekrar çalıştır.
"""
import os, sys, importlib

BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURASI)
import cizim

# (modül adı, hafta -> fonksiyon listesi biçimi)
TEK_HAFTA = [("hafta01", 1), ("hafta02", 2), ("hafta03", 3), ("hafta09", 9)]
COK_HAFTA = ["haftalar_kalan", "tur2_a", "tur2_b", "tur2_c", "tur2_d", "tur3_a", "tur4_a", "tur4_b", "tur4_c"]


def calistir(docs_kok):
    uretilen = 0
    for ad, hafta in TEK_HAFTA:
        m = importlib.import_module(ad)
        klasor = os.path.join(docs_kok, f"week-{hafta}", "assets")
        fnlar = [getattr(m, a) for a in dir(m)
                 if a.startswith("d") and a[1:].isdigit() and callable(getattr(m, a))]
        for fn in sorted(fnlar, key=lambda f: f.__name__):
            fn(klasor); uretilen += 1
        # hafta09 farklı adlandırma kullanıyor
        for a in dir(m):
            if a.startswith("h09_") and callable(getattr(m, a)):
                getattr(m, a)(klasor); uretilen += 1

    for ad in COK_HAFTA:
        m = importlib.import_module(ad)
        m.KOK = docs_kok
        for hafta, fnlar in m.ISLER.items():
            klasor = os.path.join(docs_kok, f"week-{hafta}", "assets")
            for fn in fnlar:
                fn(klasor); uretilen += 1

    print(f"Üretilen diyagram: {uretilen}")
    sorunlu = cizim.rapor()
    return uretilen, sorunlu


if __name__ == "__main__":
    docs = sys.argv[1] if len(sys.argv) > 1 else "docs"
    _, sorunlu = calistir(docs)
    sys.exit(1 if sorunlu else 0)
