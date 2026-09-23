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


KUTU_METINLERI = []   # (metin_sanatcisi, kutu_sol, kutu_sag) — kutu taşması denetimi için


def tuval(g=12.0, y=6.0):
    """Yeni bir çizim alanı (inç). 0..100 x 0..100 koordinat sistemi döner."""
    KUTU_METINLERI.clear()
    fig, ax = plt.subplots(figsize=(g, y))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100)
    ax.axis("off")
    fig.patch.set_facecolor("white")
    return fig, ax


def baslik(ax, metin, alt=None, y=95):
    # Uzun başlık alt başlığa değmesin diye yazıyı küçült ve arayı aç.
    bb = 19 if len(metin) <= 42 else (17 if len(metin) <= 54 else 15.5)
    ax.text(50, y, metin, ha="center", va="top", fontsize=bb, fontweight="bold", color=KOYU)
    if alt:
        ax.text(50, y - (7.6 if bb >= 17 else 6.8), alt, ha="center", va="top",
                fontsize=12.0, color=SOLUK)
    _by = y - (16.8 if alt else 7.6)
    ax.add_patch(FancyBboxPatch((46, _by), 8, 0.6,
                                boxstyle="round,pad=0,rounding_size=0.3",
                                linewidth=0, facecolor=ACIK, zorder=3))


def kutu(ax, x, y, g, y_yuk, baslik_metin, satirlar=None, dolgu=COKACIK, kenar=ANA,
         yazi=YAZI, bas_renk=None, bas_boyut=13.5, satir_boyut=11.0, kalin=True, yuvarlak=2.2):
    """Ortası (x,y), genişlik g, yükseklik y_yuk olan yuvarlak kutu."""
    # yumuşak gölge (derinlik hissi)
    ax.add_patch(FancyBboxPatch((x - g / 2 + 0.45, y - y_yuk / 2 - 0.55), g, y_yuk,
                                boxstyle=f"round,pad=0,rounding_size={yuvarlak}",
                                linewidth=0, facecolor="#00000014", zorder=1.5))
    kutucuk = FancyBboxPatch((x - g / 2, y - y_yuk / 2), g, y_yuk,
                             boxstyle=f"round,pad=0,rounding_size={yuvarlak}",
                             linewidth=1.7, edgecolor=kenar, facecolor=dolgu, zorder=2)
    ax.add_patch(kutucuk)
    bas_renk = bas_renk or (yazi if dolgu != KOYU else "white")
    satirlar = satirlar or []
    # Metin bloğunu kutu içinde DİKEY ORTALA; satır aralığını kutuya sığacak şekilde seç.
    adet = 1 + len(satirlar)
    if adet == 1:
        yazi_ogesi = ax.text(x, y, baslik_metin, ha="center", va="center",
                             fontsize=bas_boyut, fontweight="bold" if kalin else "normal",
                             color=bas_renk, zorder=3)
        KUTU_METINLERI.append((yazi_ogesi, x - g / 2, x + g / 2))
        return kutucuk
    aralik = min(4.8, max(2.8, (y_yuk - 3.0) / adet))
    blok = (adet - 1) * aralik
    ust = y + blok / 2
    yazi_ogesi = ax.text(x, ust, baslik_metin, ha="center", va="center",
                         fontsize=bas_boyut, fontweight="bold" if kalin else "normal",
                         color=bas_renk, zorder=3)
    KUTU_METINLERI.append((yazi_ogesi, x - g / 2, x + g / 2))
    for i, s in enumerate(satirlar, start=1):
        alt_oge = ax.text(x, ust - i * aralik, s, ha="center", va="center",
                          fontsize=satir_boyut, color=bas_renk, zorder=3)
        KUTU_METINLERI.append((alt_oge, x - g / 2, x + g / 2))
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


def sigdir(fig, ax, tur=0.25, en_az=7.5, tur_sayisi=6):
    """Kutusuna sığmayan yazıları ölçüp küçültür.

    Yazı genişliği yazı tipine, harflere ve şekil boyutuna bağlı olduğu için
    önceden kestirilemez; burada gerçekten çizip ölçüyor ve yalnız taşan
    yazıyı, yalnız gerektiği kadar küçültüyoruz.
    """
    for _ in range(tur_sayisi):
        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        degisti = False
        for oge, sol, sag in KUTU_METINLERI:
            if not oge.get_text().strip():
                continue
            kb = _veri_kutusu(oge, ax, renderer)
            if kb is None:
                continue
            x0, _, x1, _ = kb
            if max(sol - x0, x1 - sag) <= tur:
                continue
            genislik = max(x1 - x0, 0.1)
            oran = min(0.94, max(0.55, (sag - sol - 0.8) / genislik))
            yeni = oge.get_fontsize() * oran
            if yeni < en_az - 0.01:
                yeni = en_az
            if yeni < oge.get_fontsize() - 0.01:
                oge.set_fontsize(yeni)
                degisti = True
        if not degisti:
            break


def kaydet(fig, klasor, ad, png=True, dpi=200):
    """SVG (ana) ve isteğe bağlı PNG (PPTX/DOCX için) yazar."""
    os.makedirs(klasor, exist_ok=True)
    sigdir(fig, fig.axes[0])               # kutuya sığmayan yazıyı küçült
    denetle(fig, fig.axes[0], ad)          # turlama: kaydetmeden önce tara
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
        kutu(ax, 26, yc, 46, yuk, ad, dolgu=dolgu, kenar=kenar, bas_renk=yz, bas_boyut=11.8)
        if aciklama:
            # Açıklama sağa taşmasın: kalan genişliğe göre yazıyı küçült, gerekirse böl.
            kalan = 98 - 51
            fs = 10.2 if len(aciklama) <= 46 else (9.2 if len(aciklama) <= 58 else 8.4)
            if len(aciklama) > 70:
                kes = aciklama.rfind(" ", 0, 68)
                aciklama = aciklama[:kes] + chr(10) + aciklama[kes+1:]
                fs = 8.6
            ax.text(51, yc, aciklama, ha="left", va="center", fontsize=fs, color=SOLUK)
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
    sol, sag = 13, 87          # uçlardaki yazılar tuval dışına taşmasın
    ax.plot([sol, sag], [y0, y0], color=ACIK, linewidth=4, zorder=1, solid_capstyle="round")
    adim = (sag - sol) / max(n - 1, 1)
    for i, (yil, metin) in enumerate(olaylar):
        x = sol + i * adim
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


def ic_ice(baslik_metin, katmanlar, alt_metin=None, dip=None, g=11.5, y=7.2):
    """İç içe (eş merkezli) katmanlar: en dıştaki ilk. [(metin, renk_anahtarı), ...]
    En içteki çekirdek en son gelir."""
    renk_sira = [COKACIK, "#d3eef0", "#b9e3e5", ACIK, "#7cc9cc", "#4cb5ac", ANA, KOYU]
    n = len(katmanlar)
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    ust, alt_s = 77, 7
    sol0, sag0 = 3, 97
    # Dikey adım, etiketlerin çakışmaması için en az 6 birim olmalı.
    dikey = max(6.0, (ust - alt_s) / (2.0 * max(n, 1)))
    yatay = min(6.5, 46.0 / max(n, 1))
    for i, (metin, _rk) in enumerate(katmanlar):
        x0 = sol0 + i * yatay
        x1 = sag0 - i * yatay
        y1 = ust - i * dikey
        y0 = alt_s + i * dikey
        dolgu = renk_sira[min(i, len(renk_sira) - 1)]
        koyu_mu = dolgu in (ANA, KOYU, "#4cb5ac")
        ax.add_patch(FancyBboxPatch((x0, y0), x1 - x0, y1 - y0,
                                    boxstyle="round,pad=0,rounding_size=1.8",
                                    linewidth=1.5, edgecolor=ANA if not koyu_mu else "white",
                                    facecolor=dolgu, zorder=1 + i))
        son = (i == n - 1)
        ty = (y0 + y1) / 2 if son else y1 - dikey / 2
        ax.text((x0 + x1) / 2, ty, metin, ha="center", va="center",
                fontsize=9.6 if n > 6 else (10.6 if n > 4 else 11.4),
                color="white" if koyu_mu else YAZI, fontweight="bold", zorder=2 + i)
    if dip:
        serit(ax, 5, dip)
    return fig, ax


def agac(baslik_metin, hedef, dallar, alt_metin=None, dip=None, g=12.5, y=5.8):
    """Saldırı ağacı. dallar = [(dal_metni, kapi 'VEYA'/'VE', [alt_adımlar]), ...]"""
    n = len(dallar)
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    kutu(ax, 50, 77, 62, 10, hedef, dolgu=KOYU, kenar=KOYU, bas_renk="white", bas_boyut=13)
    etiket(ax, 50, 68, "VEYA", boyut=10.5, renk=KOTU, kalin=True)
    gen = (94 - (n - 1) * 3.0) / n
    for i, (dal, kapi, adimlar) in enumerate(dallar):
        x = 3 + gen / 2 + i * (gen + 3.0)
        ok(ax, 50, 72, x, 63.5, renk=SOLUK, kalinlik=1.6)
        kutu(ax, x, 57, gen, 13, dal, dolgu=UYARIBG, kenar=UYARI, bas_boyut=11.2)
        etiket(ax, x, 47.5, kapi, boyut=10, renk=KOTU if kapi == "VEYA" else IYI, kalin=True)
        m = len(adimlar)
        for j, ad in enumerate(adimlar):
            yj = 40 - j * 10.5
            kutu(ax, x, yj, gen, 8.6, ad, dolgu=COKACIK, kenar=ANA, bas_boyut=10.0, kalin=False)
            ok(ax, x, (50.5 if j == 0 else yj + 10.5 - 4.3), x, yj + 4.3, renk=SOLUK, kalinlik=1.3)
    if dip:
        serit(ax, 5, dip)
    return fig, ax


def iliski(baslik_metin, dugumler, baglar, alt_metin=None, dip=None, g=12.0, y=5.2):
    """Serbest ilişki grafiği. dugumler = {ad: (x, y, metin, renk_anahtarı, genişlik, yükseklik)}
    baglar = [(a, b, etiket, kesik_mi, renk_anahtarı), ...]"""
    renkler = {"ana": (COKACIK, ANA, YAZI), "iyi": (IYIBG, IYI, YAZI), "kotu": (KOTUBG, KOTU, YAZI),
               "uyari": (UYARIBG, UYARI, YAZI), "mor": (MORBG, MOR, YAZI), "koyu": (KOYU, KOYU, "white")}
    ok_renk = {"iyi": IYI, "kotu": KOTU, "uyari": UYARI, "ana": SOLUK, "mor": MOR}
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    yer = {}
    for ad, (x, yy, metin, rk, gw, gh) in dugumler.items():
        dolgu, kenar, yz = renkler.get(rk, renkler["ana"])
        satirlar = metin.split("|")
        kutu(ax, x, yy, gw, gh, satirlar[0], satirlar[1:], dolgu=dolgu, kenar=kenar,
             bas_renk=yz, bas_boyut=12, satir_boyut=10)
        yer[ad] = (x, yy, gw, gh)
    for a, b, et, kesik, rk in baglar:
        ax1, ay1, aw, ah = yer[a]
        bx1, by1, bw, bh = yer[b]
        dx, dy = bx1 - ax1, by1 - ay1
        if abs(dx) > abs(dy):
            x1 = ax1 + (aw / 2) * (1 if dx > 0 else -1); y1 = ay1
            x2 = bx1 - (bw / 2) * (1 if dx > 0 else -1); y2 = by1
        else:
            x1 = ax1; y1 = ay1 + (ah / 2) * (1 if dy > 0 else -1)
            x2 = bx1; y2 = by1 - (bh / 2) * (1 if dy > 0 else -1)
        ok(ax, x1, y1, x2, y2, renk=ok_renk.get(rk, SOLUK), kesik=kesik, etiket=et, etiket_boyut=9.8)
    if dip:
        serit(ax, 6, dip)
    return fig, ax


def adimlar(baslik_metin, ogeler, alt_metin=None, dip=None, dip_renk=None,
            satir_basina=4, g=12.0, y=5.6, dongu=None):
    """Numaralı süreç adımları; satır başına en çok `satir_basina` kutu, sonra alt satıra kayar.
    ogeler = [(başlık, [satırlar], renk_anahtarı), ...]  dongu: alttan başa dönüş etiketi."""
    renkler = {"ana": (COKACIK, ANA, YAZI), "iyi": (IYIBG, IYI, YAZI), "kotu": (KOTUBG, KOTU, YAZI),
               "uyari": (UYARIBG, UYARI, YAZI), "mor": (MORBG, MOR, YAZI), "koyu": (KOYU, KOYU, "white")}
    n = len(ogeler)
    satir_sayisi = (n + satir_basina - 1) // satir_basina
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    ust = 74
    satir_yuk = min(26, (ust - 22) / satir_sayisi)
    bosluk = 3.0
    merkezler = []
    for r in range(satir_sayisi):
        parca = ogeler[r * satir_basina:(r + 1) * satir_basina]
        m = len(parca)
        gen = (94 - (m - 1) * bosluk) / m
        yc = ust - satir_yuk / 2 - r * (satir_yuk + 4)
        for i, (bas, satirlar, rk) in enumerate(parca):
            dolgu, kenar, yz = renkler.get(rk, renkler["ana"])
            x = 3 + gen / 2 + i * (gen + bosluk)
            kutu(ax, x, yc, gen, satir_yuk - 3, bas, satirlar, dolgu=dolgu, kenar=kenar,
                 bas_renk=yz, bas_boyut=11.4 if m > 3 else 12.4, satir_boyut=9.5 if m > 3 else 10.2)
            merkezler.append((x, yc, gen, satir_yuk - 3))
            if i < m - 1:
                ok(ax, x + gen / 2 + 0.3, yc, x + gen / 2 + bosluk - 0.3, yc, renk=SOLUK, kalinlik=1.8)
        if r < satir_sayisi - 1:
            # satır sonu -> sonraki satır başı bağlantısı
            sx, sy, sg, sh = merkezler[-1]
            ax.plot([sx + sg / 2 + 1.2, 97, 97], [sy, sy, sy - satir_yuk / 2 - 2],
                    color=SOLUK, linewidth=1.6, zorder=1)
            ax.plot([97, 3, 3], [sy - satir_yuk / 2 - 2, sy - satir_yuk / 2 - 2,
                                 sy - satir_yuk - 4], color=SOLUK, linewidth=1.6, zorder=1)
            ok(ax, 3, sy - satir_yuk - 4, 3 + 0.1, sy - satir_yuk - 4 - 0.1, renk=SOLUK, kalinlik=1.6)
    if dongu and merkezler:
        sx, sy, sg, sh = merkezler[-1]
        bx, by, bg, bh = merkezler[0]
        alt_y = min(m2[1] - m2[3] / 2 for m2 in merkezler) - 5
        ax.plot([sx, sx, bx, bx], [sy - sh / 2, alt_y, alt_y, by - bh / 2],
                color=IYI, linewidth=1.8, linestyle=(0, (5, 3)), zorder=1)
        ax.text((sx + bx) / 2, alt_y - 2.4, dongu, ha="center", va="top", fontsize=10, color=IYI)
    if dip:
        serit(ax, 8, dip, renk=dip_renk or KOYU,
              dolgu=KOTUBG if dip_renk == KOTU else COKACIK)
    return fig, ax


def dizi(baslik_metin, aktorler, mesajlar, alt_metin=None, dip=None, g=12.0, y=6.0):
    """Dizi (sequence) diyagramı.
    aktorler = ["İstemci", "Sunucu", ...]
    mesajlar = [(kaynak_idx, hedef_idx, metin, 'ileri'|'geri'|'not'), ...]
    'not' türünde kaynak_idx kutunun ortalanacağı sütundur (hedef yok sayılır)."""
    na = len(aktorler)
    fig, ax = tuval(g, y)
    baslik(ax, baslik_metin, alt_metin)
    # Alt başlık varsa vurgu çizgisi y=78'e iner; aktör kutuları onun altında kalmalı.
    ust = 71 if alt_metin else 78
    alt_s = 16 if dip else 8
    xs = [(100.0 / (na + 1)) * (i + 1) for i in range(na)]
    for i, ad in enumerate(aktorler):
        # Kutular bitişmesin: merkez aralığından biraz dar tutulur.
        kutu(ax, xs[i], ust, min(30, 100.0 / (na + 1) - 3), 9, ad, dolgu=KOYU, kenar=KOYU,
             bas_renk="white", bas_boyut=11.5)
        ax.plot([xs[i], xs[i]], [ust - 5.5, alt_s], color=CIZGI, linewidth=1.6,
                linestyle=(0, (4, 4)), zorder=1)
    n = len(mesajlar)
    adim = (ust - 10 - alt_s) / max(n, 1)
    for j, (a, b, metin, tur) in enumerate(mesajlar):
        yy = ust - 10 - j * adim
        if tur == "not":
            g2 = 62.0
            # Not kutusu tuvalin dışına taşmasın diye merkez kırpılır.
            cx = min(max(xs[a], 3 + g2 / 2), 97 - g2 / 2)
            ax.add_patch(FancyBboxPatch((cx - g2 / 2, yy - 3.2), g2, 6.4,
                                        boxstyle="round,pad=0,rounding_size=1.4",
                                        linewidth=1.2, edgecolor=UYARI, facecolor=UYARIBG, zorder=3))
            ax.text(cx, yy, metin, ha="center", va="center", fontsize=9.6, color=UYARI, zorder=4)
        else:
            renk = ANA if tur == "ileri" else IYI
            ok(ax, xs[a], yy, xs[b], yy, renk=renk, kalinlik=1.8,
               kesik=(tur == "geri"), etiket=metin, etiket_boyut=9.4, etiket_kay=1.4)
    if dip:
        serit(ax, 7, dip)
    return fig, ax


# ============================ OTOMATİK DENETİM ============================
# Turlama yöntemi: her diyagram kaydedilirken kendini denetler; hatalar
# elle aranmaz, tarama raporlar. UYARILAR listesinde toplanır.

UYARILAR = []


def _veri_kutusu(sanatci, ax, renderer):
    """Bir çizim öğesinin veri koordinatlarındaki sınırlarını döndürür."""
    try:
        kutu = sanatci.get_window_extent(renderer=renderer)
        ters = ax.transData.inverted()
        (x0, y0), (x1, y1) = ters.transform([[kutu.x0, kutu.y0], [kutu.x1, kutu.y1]])
        return min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)
    except Exception:
        return None


def denetle(fig, ax, ad, tasma_payi=0.8):
    """Tuval dışına taşan ve üst üste binen METİNLERİ bulur."""
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    sorunlar = []

    metinler = []
    for t in ax.texts:
        if not t.get_text().strip():
            continue
        kb = _veri_kutusu(t, ax, renderer)
        if kb is None:
            continue
        metinler.append((t.get_text().strip()[:34], kb))
        x0, y0, x1, y1 = kb
        if x0 < -tasma_payi or x1 > 100 + tasma_payi or y0 < -tasma_payi or y1 > 100 + tasma_payi:
            sorunlar.append(f"TAŞMA  '{t.get_text().strip()[:34]}'  x[{x0:.1f},{x1:.1f}] y[{y0:.1f},{y1:.1f}]")

    # Metin-metin çakışması (aynı diyagramda iki yazı üst üste binmiş mi?)
    for i in range(len(metinler)):
        for j in range(i + 1, len(metinler)):
            (m1, a), (m2, b) = metinler[i], metinler[j]
            ax0 = max(a[0], b[0]); ay0 = max(a[1], b[1])
            ax1 = min(a[2], b[2]); ay1 = min(a[3], b[3])
            if ax1 - ax0 > 1.2 and ay1 - ay0 > 1.2:      # anlamlı örtüşme
                sorunlar.append(f"ÇAKIŞMA  '{m1}'  ↔  '{m2}'")

    # Kutu içindeki yazı kutunun dışına taşmış mı? (gözle fark edilmesi zor)
    for oge, sol, sag in KUTU_METINLERI:
        if not oge.get_text().strip():
            continue
        kb = _veri_kutusu(oge, ax, renderer)
        if kb is None:
            continue
        x0, _, x1, _ = kb
        tasan = max(sol - x0, x1 - sag)
        if tasan > 0.25:
            sorunlar.append(
                f"KUTU TAŞMASI  '{oge.get_text().strip()[:34]}'  {tasan:.1f} birim "
                f"(yazı x[{x0:.1f},{x1:.1f}] kutu x[{sol:.1f},{sag:.1f}])")

    if sorunlar:
        UYARILAR.append((ad, sorunlar))
    return sorunlar


def rapor():
    """Turun sonunda toplu rapor. Dönüş: sorunlu diyagram sayısı."""
    if not UYARILAR:
        print("  ✓ denetim temiz — taşma/çakışma yok")
        return 0
    print(f"  ! {len(UYARILAR)} diyagramda sorun:")
    for ad, sorunlar in UYARILAR:
        print(f"    {ad}")
        for s in sorunlar[:6]:
            print(f"      - {s}")
    return len(UYARILAR)
