# -*- coding: utf-8 -*-
"""CEN429 ders görselleri için ortak çizim kitaplığı.

Amaç: mermaid/ASCII gibi metin tabanlı gösterimler yerine, her ortamda (MkDocs sitesi,
Marp HTML sunumu, PDF, DOCX, PPTX) BİREBİR aynı görünen SVG dosyaları üretmek.

- Yazılar SVG'ye **yol (path)** olarak gömülür (svg.fonttype='path'); yazı tipi
  bulunamadığı için kayma/bozulma olmaz.
- Her diyagram ayrıca 2x PNG olarak da yazılır (PPTX ve DOCX için).
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle
import matplotlib.patheffects as pe

matplotlib.rcParams["svg.fonttype"] = "path"     # yazı = vektör yol → her yerde aynı
matplotlib.rcParams["font.family"] = "DejaVu Sans"
matplotlib.rcParams["axes.unicode_minus"] = False

# --- Ders renk paleti (slayt temasıyla uyumlu) ---
KOYU    = "#006d77"
ANA     = "#0a9396"
ACIK    = "#9ed6d7"
COKACIK = "#e8f6f7"
IYI     = "#2e7d32"
IYIBG   = "#eaf4ea"
KOTU    = "#c0392b"
KOTUBG  = "#fdeaea"
UYARI   = "#b5651d"
UYARIBG = "#fdf1e7"
MOR     = "#4054b2"
MORBG   = "#eef2ff"
YAZI    = "#1f2933"
SOLUK   = "#6b7280"
CIZGI   = "#cfd8dc"


def tuval(g=12.0, y=6.0):
    """Yeni bir çizim alanı (inç). 0..100 x 0..100 koordinat sistemi döner."""
    fig, ax = plt.subplots(figsize=(g, y))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100)
    ax.axis("off")
    fig.patch.set_facecolor("white")
    return fig, ax


def baslik(ax, metin, alt=None, y=95):
    ax.text(50, y, metin, ha="center", va="top", fontsize=19, fontweight="bold", color=KOYU)
    if alt:
        ax.text(50, y - 6.5, alt, ha="center", va="top", fontsize=12.5, color=SOLUK)


def kutu(ax, x, y, g, y_yuk, baslik_metin, satirlar=None, dolgu=COKACIK, kenar=ANA,
         yazi=YAZI, bas_renk=None, bas_boyut=13.5, satir_boyut=11.0, kalin=True, yuvarlak=2.2):
    """Ortası (x,y), genişlik g, yükseklik y_yuk olan yuvarlak kutu."""
    kutucuk = FancyBboxPatch((x - g / 2, y - y_yuk / 2), g, y_yuk,
                             boxstyle=f"round,pad=0,rounding_size={yuvarlak}",
                             linewidth=1.8, edgecolor=kenar, facecolor=dolgu, zorder=2)
    ax.add_patch(kutucuk)
    bas_renk = bas_renk or (yazi if dolgu != KOYU else "white")
    satirlar = satirlar or []
    # Metin bloğunu kutu içinde DİKEY ORTALA; satır aralığını kutuya sığacak şekilde seç.
    adet = 1 + len(satirlar)
    if adet == 1:
        ax.text(x, y, baslik_metin, ha="center", va="center",
                fontsize=bas_boyut, fontweight="bold" if kalin else "normal",
                color=bas_renk, zorder=3)
        return kutucuk
    aralik = min(4.8, max(2.8, (y_yuk - 3.0) / adet))
    blok = (adet - 1) * aralik
    ust = y + blok / 2
    ax.text(x, ust, baslik_metin, ha="center", va="center",
            fontsize=bas_boyut, fontweight="bold" if kalin else "normal",
            color=bas_renk, zorder=3)
    for i, s in enumerate(satirlar, start=1):
        ax.text(x, ust - i * aralik, s, ha="center", va="center",
                fontsize=satir_boyut, color=bas_renk, zorder=3)
    return kutucuk


def ok(ax, x1, y1, x2, y2, renk=YAZI, kalinlik=2.2, kesik=False, etiket=None,
       etiket_kay=2.6, etiket_boyut=10.5, stil="-|>"):
    a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=stil, mutation_scale=16,
                        linewidth=kalinlik, color=renk, zorder=4,
                        linestyle=(0, (5, 3)) if kesik else "solid",
                        shrinkA=0, shrinkB=0)
    ax.add_patch(a)
    if etiket:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + etiket_kay, etiket, ha="center", va="bottom",
                fontsize=etiket_boyut, color=renk, zorder=5,
                path_effects=[pe.withStroke(linewidth=3, foreground="white")])
    return a


def etiket(ax, x, y, metin, boyut=11, renk=YAZI, ha="center", va="center", kalin=False):
    return ax.text(x, y, metin, ha=ha, va=va, fontsize=boyut, color=renk,
                   fontweight="bold" if kalin else "normal", zorder=5)


def serit(ax, y, metin, renk=KOYU, dolgu=None, boyut=12):
    """Alt bilgi şeridi (çıkarım cümlesi)."""
    dolgu = dolgu or COKACIK
    ax.add_patch(FancyBboxPatch((4, y - 3.6), 92, 7.2,
                                boxstyle="round,pad=0,rounding_size=1.6",
                                linewidth=0, facecolor=dolgu, zorder=1))
    ax.text(50, y, metin, ha="center", va="center", fontsize=boyut, color=renk, zorder=3)


def kaydet(fig, klasor, ad, png=True, dpi=200):
    """SVG (ana) ve isteğe bağlı PNG (PPTX/DOCX için) yazar."""
    os.makedirs(klasor, exist_ok=True)
    svg = os.path.join(klasor, ad + ".svg")
    fig.savefig(svg, format="svg", bbox_inches="tight", pad_inches=0.12, facecolor="white")
    if png:
        fig.savefig(os.path.join(klasor, ad + ".png"), format="png", dpi=dpi,
                    bbox_inches="tight", pad_inches=0.12, facecolor="white")
    plt.close(fig)
    return svg


# ============================ HAZIR YERLEŞİM ŞABLONLARI ============================
# Her diyagramı elle konumlandırmak yerine, sık kullanılan desenleri tek çağrıyla üretir.
# Böylece bütün haftalarda görsel dil aynı kalır.

def akis(ad_alt_renk, baslik_metin, alt_metin=None, dip=None, dip_renk=None,
         g=12.0, y=4.6, ok_etiketleri=None):
    """Soldan sağa akış: [(başlık, [satırlar], renk_anahtarı), ...]
    renk_anahtarı: 'ana' | 'iyi' | 'kotu' | 'uyari' | 'mor' | 'koyu'"""
    renkler = {"ana": (COKACIK, ANA, YAZI), "iyi": (IYIBG, IYI, YAZI),
               "kotu": (KOTUBG, KOTU, YAZI), "uyari": (UYARIBG, UYARI, YAZI),
               "mor": (MORBG, MOR, YAZI), "koyu": (KOYU, KOYU, "white")}
    n = len(ad_alt_renk)
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    ust = 78 if alt_metin else 80
    bosluk = 3.0
    gen = (96 - (n - 1) * bosluk) / n
    yuk = 30
    merkez = 46
    # Kutu sayısı arttıkça yazıyı küçült ki başlık kutuya sığsın.
    bb = 12.5 if n <= 3 else (11.2 if n == 4 else 10.0)
    sb = 10.2 if n <= 3 else (9.6 if n == 4 else 9.0)
    for i, (bas, satirlar, rk) in enumerate(ad_alt_renk):
        dolgu, kenar, yz = renkler.get(rk, renkler["ana"])
        x = 2 + gen / 2 + i * (gen + bosluk)
        kutu(ax, x, merkez, gen, yuk, bas, satirlar, dolgu=dolgu, kenar=kenar,
             bas_renk=yz, bas_boyut=bb, satir_boyut=sb)
        if i < n - 1:
            x1 = x + gen / 2
            et = ok_etiketleri[i] if ok_etiketleri and i < len(ok_etiketleri) else None
            ok(ax, x1 + 0.3, merkez, x1 + bosluk - 0.3, merkez, renk=SOLUK, etiket=et, etiket_boyut=9.5)
    if dip:
        serit(ax, 16, dip, renk=dip_renk or KOYU,
              dolgu=KOTUBG if dip_renk == KOTU else COKACIK)
    return fig, ax


def iki_yol(baslik_metin, sol, sag, alt_metin=None, dip=None, g=12.0, y=5.0):
    """İki şeritli karşılaştırma. sol/sag = (başlık, [satırlar], 'kotu'|'iyi')"""
    renkler = {"iyi": (IYIBG, IYI), "kotu": (KOTUBG, KOTU),
               "ana": (COKACIK, ANA), "uyari": (UYARIBG, UYARI)}
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    for (bas, satirlar, rk), x in ((sol, 26), (sag, 74)):
        dolgu, kenar = renkler.get(rk, renkler["ana"])
        kutu(ax, x, 48, 44, 40, bas, satirlar, dolgu=dolgu, kenar=kenar,
             bas_boyut=14, satir_boyut=11)
    ax.plot([50, 50], [22, 74], color=CIZGI, linewidth=1.6, zorder=1)
    if dip:
        serit(ax, 14, dip)
    return fig, ax


def katman(baslik_metin, katmanlar, alt_metin=None, dip=None, dip_renk=None, g=11.0, y=5.6):
    """Üstten alta katman yığını: [(ad, açıklama, renk_anahtarı), ...]"""
    renkler = {"ana": (COKACIK, ANA, YAZI), "iyi": (IYIBG, IYI, YAZI),
               "kotu": (KOTUBG, KOTU, YAZI), "uyari": (UYARIBG, UYARI, YAZI),
               "mor": (MORBG, MOR, YAZI), "koyu": (KOYU, KOYU, "white")}
    n = len(katmanlar)
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    ust, alt_s = 76, 20
    yuk = (ust - alt_s) / n - 2.2
    for i, (ad, aciklama, rk) in enumerate(katmanlar):
        dolgu, kenar, yz = renkler.get(rk, renkler["ana"])
        yc = ust - yuk / 2 - i * (yuk + 2.2)
        kutu(ax, 32, yc, 56, yuk, ad, dolgu=dolgu, kenar=kenar, bas_renk=yz, bas_boyut=12.5)
        if aciklama:
            ax.text(62, yc, aciklama, ha="left", va="center", fontsize=10.4, color=SOLUK)
    if dip:
        serit(ax, 12, dip, renk=dip_renk or KOYU,
              dolgu=KOTUBG if dip_renk == KOTU else COKACIK)
    return fig, ax


def zaman(baslik_metin, olaylar, alt_metin=None, dip=None, g=12.0, y=4.8):
    """Yatay zaman çizelgesi: [(yıl, metin), ...]"""
    n = len(olaylar)
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    y0 = 46
    ax.plot([6, 94], [y0, y0], color=ACIK, linewidth=4, zorder=1, solid_capstyle="round")
    adim = 88 / max(n - 1, 1)
    for i, (yil, metin) in enumerate(olaylar):
        x = 6 + i * adim
        ax.plot([x], [y0], marker="o", markersize=11, color=KOYU,
                markeredgecolor="white", markeredgewidth=1.8, zorder=3)
        ust = (i % 2 == 0)
        ty = y0 + 9 if ust else y0 - 9
        ax.text(x, ty, yil, ha="center", va="bottom" if ust else "top",
                fontsize=12, fontweight="bold", color=KOYU, zorder=4)
        ax.text(x, ty + (7 if ust else -7), metin, ha="center", va="bottom" if ust else "top",
                fontsize=9.8, color=YAZI, zorder=4, wrap=True)
    if dip:
        serit(ax, 10, dip)
    return fig, ax
