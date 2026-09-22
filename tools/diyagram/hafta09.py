# -*- coding: utf-8 -*-
"""Hafta 9 — Gelişmiş kod gizleme ve çeşitlendirme görselleri."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *


def h09_01_bes_aile(klasor):
    fig, ax = tuval(12, 6.4)
    baslik(ax, "Gizlemenin beş ailesi", "aşağıdan yukarı: güç ↑ · maliyet ↑")
    aileler = [
        ("1 · Düzen / Ad", "isim · biçim · dize", ACIK, 30),
        ("2 · Veri", "aritmetik · sabit gizleme", "#6ec6c8", 42),
        ("3 · Kontrol akışı", "düzleştirme · opak yüklem", "#33a7ab", 54),
        ("4 · Önleyici", "anti-debug · anti-analiz", ANA, 66),
        ("5 · Sanallaştırma", "bytecode + yorumlayıcı", KOYU, 78),
    ]
    for i, (ad, alt, renk, gen) in enumerate(aileler):
        y = 66 - i * 11.5
        koyu_mu = renk in (ANA, KOYU)
        kutu(ax, 8 + gen / 2, y, gen, 9.4, ad, dolgu=renk, kenar=renk,
             bas_renk="white" if koyu_mu else YAZI, bas_boyut=12.5)
        ax.text(8 + gen + 2.5, y, alt, ha="left", va="center", fontsize=10.5, color=SOLUK)
    ok(ax, 4.5, 14, 4.5, 72, renk=SOLUK, kalinlik=2.0)
    ax.text(1.6, 43, "güç ve maliyet", rotation=90, ha="center", va="center",
            fontsize=11, color=SOLUK)
    serit(ax, 7, "Güç birliktelikten ve çeşitlendirmeden gelir; her aile ölçülmeli. Hiçbiri anahtarı korumaz.",
          renk=KOTU, dolgu=KOTUBG)
    return kaydet(fig, klasor, "h09-01-bes-aile")


def h09_02_opak_yuklem(klasor):
    fig, ax = tuval(12, 5.6)
    baslik(ax, "Opak yüklem: gerçek yol ile ölü yol", "program hep aynı çalışır, analizci iki yolu da incelemek zorunda kalır")
    kutu(ax, 16, 66, 26, 12, "if ( x·(x+1) çift mi? )", ["matematikçe: DAİMA doğru"],
         dolgu=MORBG, kenar=MOR, bas_boyut=12.5, satir_boyut=10.5)
    ok(ax, 29, 69, 41.5, 75, renk=IYI, etiket="true (daima)", etiket_boyut=10)
    ok(ax, 29, 63, 41.5, 49, renk=KOTU, kesik=True, etiket="false (asla)", etiket_boyut=10, etiket_kay=-5.5)
    kutu(ax, 58, 77, 32, 12, "GERÇEK YOL", ["gercek_adim(durum)", "her çalıştırmada burası"],
         dolgu=IYIBG, kenar=IYI, bas_boyut=12.5, satir_boyut=10.2)
    kutu(ax, 58, 45, 32, 12, "ÖLÜ YOL", ["sahte_adim(durum)", "hiç çalışmaz"],
         dolgu=KOTUBG, kenar=KOTU, bas_boyut=12.5, satir_boyut=10.2)
    kutu(ax, 87, 61, 20, 27, "Statik analiz", ["iki yolu da", "gerçek sayar", "→ iş 2 katına", "çıkar"],
         dolgu=UYARIBG, kenar=UYARI, bas_boyut=12.0, satir_boyut=10.0)
    ok(ax, 74.5, 77, 78, 68, renk=UYARI, kalinlik=1.8)
    ok(ax, 74.5, 45, 78, 54, renk=UYARI, kalinlik=1.8)
    serit(ax, 10, "Maliyet düşük · Sınır: klasik kalıplar araçlarca tanınır → tohumla çeşitlendirin (14. hafta).",
          renk=KOYU)
    return kaydet(fig, klasor, "h09-02-opak-yuklem")


if __name__ == "__main__":
    klasor = sys.argv[1]
    for f in (h09_01_bes_aile, h09_02_opak_yuklem):
        print("  ", f(klasor))
