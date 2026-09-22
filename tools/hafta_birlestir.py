"""Bir haftanın konu kümesi parçalarını (docs/week-N/parcalar, slides/week-N/parcalar) tek sayfa ve tek sunumda
birleştirir.

Kullanım:
    py -3.12 tools/hafta_birlestir.py 2 --sira A,C,B,D,E            # yalnız plan ve istatistik
    py -3.12 tools/hafta_birlestir.py 2 --sira A,C,B,D,E --uygula   # yaz (eskiler parcalar/_arsiv/ altına)

Sayfa: mevcut sayfanın başı (ön bilgi, bilgi tablosu, materyal bloğu, hedefler, ders akışı, laboratuvar, etik,
1. bölüm) korunur; ardından parçalar verilen sırayla gelir. Parçalardaki numarasız "## " başlıkları sırayla
numaralanır. "E0-*.tr.md" varsa baştaki "Ders akışı" kutusunun yerine geçer.
Sunum: mevcut sunumun ön bilgisi ve ilk bölüm slaytına kadarki giriş slaytları + parçalar + "Gelecek hafta" slaytı.
"""
import argparse
import datetime
import pathlib
import re
import shutil
import sys

KOK = pathlib.Path(__file__).resolve().parent.parent


def cit_disinda(satirlar):
    """(satır, kod_bloğu_içinde_mi) çiftleri üretir; girintili çitleri de tanır."""
    cit = None
    for s in satirlar:
        m = re.match(r'^\s*(```+|~~~+)', s)
        if m:
            isaret = m.group(1)[0] * 3
            if cit is None:
                cit = isaret
                yield s, True
                continue
            if s.strip().startswith(cit):
                cit = None
                yield s, True
                continue
        yield s, cit is not None


def sayfa_basi(metin):
    """İkinci '## ' başlığına kadar olan kısım (ön bilgi + bilgi tablosu + ... + 1. bölüm)."""
    satirlar = metin.split('\n')
    adet = 0
    for i, (s, kodda) in enumerate(cit_disinda(satirlar)):
        if not kodda and s.startswith('## '):
            adet += 1
            if adet == 2:
                bas = '\n'.join(satirlar[:i]).rstrip()
                if bas.endswith('\n---'):          # ayırıcıyı birleştirirken kendimiz koyuyoruz
                    bas = bas[:-4].rstrip()
                return bas + '\n'
    sys.exit('Sayfada ikinci "## " başlığı bulunamadı.')


def ders_akisini_degistir(bas, e0):
    """'??? info "Ders akışı ..."' kutusunu E0 parçasıyla değiştirir."""
    satirlar = bas.split('\n')
    for i, s in enumerate(satirlar):
        if s.startswith('??? info "Ders akışı'):
            j = i + 1
            while j < len(satirlar) and (satirlar[j].startswith('    ') or not satirlar[j].strip()):
                if not satirlar[j].strip() and j + 1 < len(satirlar) and not satirlar[j + 1].startswith('    '):
                    break
                j += 1
            e0 = e0.strip('\n')
            if not e0.lstrip().startswith(('???', '!!!')):
                e0 = '??? info "Ders akışı (öğretim üyesi için zaman planı)"\n' + '\n'.join(
                    ('    ' + x) if x.strip() else '' for x in e0.split('\n'))
            return '\n'.join(satirlar[:i] + e0.split('\n') + satirlar[j:])
    print('   UYARI: "Ders akışı" kutusu bulunamadı; E0 eklenmedi')
    return bas


def numarala(metin):
    satirlar, cikti, sayac = metin.split('\n'), [], 0
    for s, kodda in cit_disinda(satirlar):
        if not kodda and s.startswith('## '):
            m = re.match(r'^## (\d+)\.\s', s)
            if m:
                sayac = int(m.group(1))
            else:
                sayac += 1
                s = f'## {sayac}. {s[3:].strip()}'
        cikti.append(s)
    return '\n'.join(cikti)


def slaytlara_bol(metin):
    """Ön bilgi ve slayt listesi (Marp '---' ayırıcıları; kod blokları içindekiler sayılmaz)."""
    satirlar = metin.split('\n')
    if satirlar[0].strip() != '---':
        return None, [metin]
    son = next(i for i in range(1, len(satirlar)) if satirlar[i].strip() == '---')
    on_bilgi = '\n'.join(satirlar[:son + 1])
    slaytlar, gecerli = [], []
    for s, kodda in cit_disinda(satirlar[son + 1:]):
        if not kodda and s.strip() == '---':
            slaytlar.append('\n'.join(gecerli))
            gecerli = []
        else:
            gecerli.append(s)
    slaytlar.append('\n'.join(gecerli))
    return on_bilgi, [x for x in slaytlar if x.strip()]


def slayt_say(metin):
    on, slaytlar = slaytlara_bol(metin if metin.startswith('---') else '---\n---\n' + metin)
    return len(slaytlar)


def arsivle(yol, klasor, damga):
    klasor.mkdir(parents=True, exist_ok=True)
    hedef = klasor / f'{yol.stem}.{damga}{yol.suffix}'
    shutil.copy2(yol, hedef)
    return hedef


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('hafta', type=int)
    ap.add_argument('--sira', required=True, help='parça harfleri, virgülle (ör. A,C,B,D,E)')
    ap.add_argument('--uygula', action='store_true')
    a = ap.parse_args()
    n = a.hafta
    sayfa = KOK / 'docs' / f'week-{n}' / f'cen429-week-{n}.tr.md'
    sunum = KOK / 'slides' / f'week-{n}' / f'cen429-week-{n}.tr.md'
    sp, ss = sayfa.parent / 'parcalar', sunum.parent / 'parcalar'
    harfler = [h.strip().upper() for h in a.sira.split(',') if h.strip()]

    def parca(klasor, harf):
        adaylar = sorted(p for p in klasor.glob(f'{harf}-*.tr.md'))
        return adaylar[0] if adaylar else None

    # ---- sayfa
    bas = sayfa_basi(sayfa.read_text(encoding='utf-8'))
    e0 = next(iter(sorted(sp.glob('E0-*.tr.md'))), None)
    if e0:
        bas = ders_akisini_degistir(bas, e0.read_text(encoding='utf-8'))
    govde, eksik = [], []
    for h in harfler:
        p = parca(sp, h)
        if not p:
            eksik.append(f'sayfa {h}')
            continue
        metin = p.read_text(encoding='utf-8').strip('\n')
        govde.append(metin)
        print(f'   sayfa parçası {p.name}: {len(metin.split())} sözcük')
    kod = KOK / 'code' / f'week-{n:02d}'
    demo_sayisi = len([d for d in kod.iterdir() if d.is_dir() and (d / 'CMakeLists.txt').exists()]) if kod.exists() else 0
    bas = re.sub(r'— \d+ demo', f'— {demo_sayisi} demo', bas, count=1)
    yeni_sayfa = numarala(bas.rstrip() + '\n\n---\n\n' + '\n\n---\n\n'.join(govde) + '\n')

    # ---- sunum
    on_bilgi, eski = slaytlara_bol(sunum.read_text(encoding='utf-8'))
    giris = []
    for s in eski:
        if '_class: bolum' in s:
            break
        giris.append(s)
    kapanis = [s for s in eski[-2:] if 'Gelecek hafta' in s]
    yeni_slaytlar = list(giris)
    for h in harfler:
        p = parca(ss, h)
        if not p:
            eksik.append(f'sunum {h}')
            continue
        metin = p.read_text(encoding='utf-8').strip('\n')
        if metin.startswith('---\n'):
            metin = metin[4:]
        adet = slayt_say(metin)
        print(f'   sunum parçası {p.name}: {adet} slayt')
        yeni_slaytlar.append(metin)
    yeni_slaytlar += kapanis
    yeni_sunum = on_bilgi + '\n\n' + '\n\n---\n\n'.join(x.strip('\n') for x in yeni_slaytlar) + '\n'

    print(f'Sayfa: {len(yeni_sayfa.split())} sözcük (önce {len(sayfa.read_text(encoding="utf-8").split())})')
    print(f'Sunum: {slayt_say(yeni_sunum)} slayt (önce {len(eski)}); demo klasörü: {demo_sayisi}')
    if eksik:
        print('EKSİK PARÇA:', ', '.join(eksik))
    if not a.uygula:
        print('(yalnız plan; yazmak için --uygula)')
        return
    damga = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    print('   arşiv:', arsivle(sayfa, sp / '_arsiv', damga).relative_to(KOK))
    print('   arşiv:', arsivle(sunum, ss / '_arsiv', damga).relative_to(KOK))
    sayfa.write_text(yeni_sayfa, encoding='utf-8', newline='\n')
    sunum.write_text(yeni_sunum, encoding='utf-8', newline='\n')
    print('Yazıldı.')


if __name__ == '__main__':
    main()
