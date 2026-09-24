"""CEN429 ders çıktılarını yerelde üretir.

Her hafta (ve izlence) için:
    sunum   : slides/.../*.tr.md  -> docs/.../*-sunum.html      (Marp, gömülü iframe için)
    sunum-pdf: *-sunum.html       -> docs/.../*-sunum.pdf       (Chrome yazdırma; Marp PDF'ten hızlı)
    pptx    : slides/.../*.tr.md  -> docs/.../*-sunum.pptx      (python-pptx, düzenlenebilir, küçük)
    not-pdf : docs/.../*.tr.md    -> docs/.../*-ders-notu.pdf   (antetli; site HTML'inden Chrome ile)
    docx    : docs/.../*.tr.md    -> docs/.../*-ders-notu.docx  (antetli; pandoc)
    basliklar: sayfa başına indirme düğmeleri ve gömülü sunum (iframe) bloğunu yazar/günceller
    iskelet : eksik haftalar ve izlence için başlangıç sunumu oluşturur (var olana dokunmaz)

Kullanım (depo kökünden):
    py -3.12 tools/build_outputs.py hepsi
    py -3.12 tools/build_outputs.py sunum sunum-pdf basliklar --hafta 1,2
Yayın (GitHub Pages) bu betikte YOKTUR; ayrıca ve açık onayla yapılır.
"""
import argparse
import base64
import functools
import http.server
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import threading

KOK = pathlib.Path(__file__).resolve().parents[1]
DOCS = KOK / 'docs'
SLIDES = KOK / 'slides'
TEMA = SLIDES / 'tema'
ARAC = KOK / 'tools'

CHROME_ADAY = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
]

# hafta: (tarih, ÖÇ, Türkçe başlık, İngilizce başlık, konu listesi)
HAFTALAR = {
    1: ('18.09.2026', '1, 5', 'Güvenli Programlamaya Giriş ve Uygulama Koruma Planı',
        'Introduction to Secure Programming and the Application Protection Plan', []),
    2: ('25.09.2026', '1', 'Bilgisayar Virüsleri ve Güvenlik Modelleri', 'Computer Viruses and Security Models',
        ['Virüs türleri (program, makro, önyükleme sektörü), solucan, truva atı; karşı önlemler',
         'Biçimsel güvenlik modelleri: Bell–LaPadula, Biba, Clark–Wilson',
         'Zafiyet sınıflandırma: CWE, OWASP Top 10, CVE, CVSS', 'Saldırı ağaçları']),
    3: ('02.10.2026', '2, 4', 'Veri Güvenliği: Aktarımda, Beklemede, Kullanımda',
        'Data Security: In Transit, At Rest, In Use',
        ['Şifreleme temelleri ve kimlik doğrulamalı şifreleme', 'TLS 1.3, sertifika doğrulama ve sabitleme',
         'Anahtar türetme, oturum anahtarları, veri maskeleme', 'Güvenlik kabukları: katmanlı veri koruması']),
    4: ('09.10.2026', '3', 'Kod Sağlamlaştırma: C/C++', 'Code Hardening: C/C++',
        ['Girdi doğrulama, format string, taşmalar, serbest bırakılmış belleğin kullanımı',
         'SEI CERT C/C++, sanitizer\'lar, fuzzing', 'Derleyici ve işletim sistemi korumaları',
         'Sembol görünürlüğü, kontrol akışı düzleştirme, dize gizleme']),
    5: ('16.10.2026', '3', 'Kod Sağlamlaştırma: Java ve Yorumlanan Diller',
        'Code Hardening: Java and Interpreted Languages',
        ['Enjeksiyon savunması ve parametreli sorgular', 'ProGuard ve R8 ile küçültme ve gizleme',
         'Dize ve yöntem gizleme, JNI köprüsünün korunması', 'Bağımlılık güvenliği ve SBOM']),
    6: ('23.10.2026', '3', 'Çalışma Zamanı Uygulama Öz Koruması (RASP)', 'Runtime Application Self-Protection',
        ['Algılama, savunma, caydırma; kod bütünlüğü denetimi', 'Hata ayıklayıcı, kanca ve ortam algılama',
         'Kontrol akışı sayacı, cihaz ve sürüm bağlama', 'Müdahaleye yanıt politikası']),
    7: ('30.10.2026', '1, 2, 3, 5, 7', 'Ara Proje Gösterimleri', 'Midterm Project Demonstrations',
        ['Ara proje gösterimleri', 'Ara proje raporu: güvenlik kılavuzunun vize bölümleri']),
    8: ('31.10–08.11.2026', '1, 2, 3', 'Ara Sınav Haftası: Quiz-1', 'Midterm Exam Week: Quiz-1',
        ['Quiz-1: 1–6. haftaların konuları']),
    9: ('13.11.2026', '3', 'Gelişmiş Kod Gizleme ve Çeşitlendirme', 'Advanced Obfuscation and Diversification',
        ['Opak yüklemler, sahte kontrol akışı, ölü kod', 'Veri kodlama, anti-disassembly, kendini değiştiren kod',
         'Gizlemenin ölçülmesi: güç, dayanıklılık, maliyet']),
    10: ('20.11.2026', '2, 4', 'Sertifikalar ve Kriptografik Yöntemler', 'Certificates and Cryptographic Methods',
         ['AES ve AEAD, HMAC, RSA-OAEP/PSS, Ed25519', 'PKI, X.509, CRL ve OCSP',
          'Anahtar hiyerarşisi, rastgele sayı, PKCS#11 ve SoftHSM']),
    11: ('27.11.2026', '2, 3', 'Whitebox Kriptografi', 'Whitebox Cryptography',
         ['Beyaz kutu saldırgan modeli, kod kaldırma', 'Tablo tabanlı whitebox AES, iç ve dış kodlamalar',
          'BGE, DFA, DCA saldırıları ve katmanlı savunma']),
    12: ('04.12.2026', '5, 6, 7', 'Güvenlik Sertifikasyonları ve Sızma Testi Planlaması',
         'Security Certifications and Penetration Test Planning',
         ['Üçüncü taraf güvenlik değerlendirmesinin akışı', 'Saldırı potansiyeli derecelendirmesi',
          'SAST/DAST, fuzzing, kod incelemesi', 'Sızma testi planı ve raporu']),
    13: ('11.12.2026', '5, 7', 'Güvenlik Gereksinimleri', 'Security Requirements',
         ['Gereksinim → durum → kanıt izlenebilirliği', 'ETSI, GSMA, EMV; Ortak Kriterler ve EAL; FIPS 140-3',
          'Devredilen gereksinimler']),
    14: ('18.12.2026', '3', 'Tigress ve Çeşitlendirme', 'Tigress and Diversification',
         ['Tigress dönüşümleri', 'Tohum ile çeşitlendirme', 'Dayanıklılığın değerlendirilmesi']),
    15: ('25.12.2026', '1–7', 'Final Proje Gösterimleri', 'Final Project Demonstrations',
         ['Final proje gösterimleri', 'Final raporu: güvenlik kılavuzunun tamamı']),
    16: ('04–17.01.2027', '2–7', 'Final Dönemi: Quiz-2', 'Final Exam Period: Quiz-2',
         ['Quiz-2: 9–14. haftaların konuları']),
}


class Oge:
    """Bir hafta ya da izlence için dosya yolları."""

    def __init__(self, anahtar):
        self.anahtar = anahtar
        if anahtar == 'izlence':
            self.klasor = DOCS / 'syllabus'
            self.sayfa_tr = self.klasor / 'syllabus.tr.md'
            self.sayfa_en = self.klasor / 'syllabus.en.md'
            self.sunum_md = SLIDES / 'syllabus' / 'cen429-izlence.tr.md'
            self.sunum_md_en = SLIDES / 'syllabus' / 'cen429-izlence.en.md'
            self.ad = 'cen429-izlence'
            self.baslik_tr, self.baslik_en = 'Ders İzlencesi', 'Syllabus'
        else:
            n = int(anahtar)
            self.klasor = DOCS / f'week-{n}'
            self.sayfa_tr = self.klasor / f'cen429-week-{n}.tr.md'
            self.sayfa_en = self.klasor / f'cen429-week-{n}.en.md'
            self.sunum_md = SLIDES / f'week-{n}' / f'cen429-week-{n}.tr.md'
            self.sunum_md_en = SLIDES / f'week-{n}' / f'cen429-week-{n}.en.md'
            self.ad = f'cen429-week-{n}'
            self.baslik_tr = f'Hafta {n} — {HAFTALAR[n][2]}'
            self.baslik_en = f'Week {n} — {HAFTALAR[n][3]}'
    # Çıktı dosyaları, eski düzendeki gibi dil sonekiyle üretilir (…-sunum.tr.html, …-sunum.en.html).
    # mkdocs-static-i18n, ".tr." dosyasını Türkçe sitede, ".en." dosyasını İngilizce sitede SONEKSİZ adla yayımlar;
    # bu yüzden sayfalardaki bağlantılar soneksiz yazılır (…-sunum.html).
    TURLER = {'sunum_html': '-sunum.html', 'sunum_pdf': '-sunum.pdf', 'sunum_pptx': '-sunum.pptx',
              'not_pdf': '-ders-notu.pdf', 'not_docx': '-ders-notu.docx', 'paket': '-materyal.zip'}

    @property
    def kod_klasoru(self):
        return None if self.anahtar == 'izlence' else KOK / 'code' / f'week-{int(self.anahtar):02d}'

    def dosya(self, tur, dil='tr'):
        kok, uzanti = self.TURLER[tur].rsplit('.', 1)
        return self.klasor / f'{self.ad}{kok}.{dil}.{uzanti}'

    def baglanti(self, tur):
        return f'{self.ad}{self.TURLER[tur]}'

    def sunum_kaynak(self, dil='tr'):
        """O dilin sunum kaynağı; İngilizce deste yoksa None döner."""
        return self.sunum_md if dil == 'tr' else (
            self.sunum_md_en if self.sunum_md_en.exists() else None)

    def en_not_var(self):
        """İngilizce ders notu gerçek çeviri mi, yoksa yer tutucu mu?"""
        if not self.sayfa_en.exists():
            return False
        metin = self.sayfa_en.read_text(encoding='utf-8')
        return 'This page is being prepared' not in metin and len(metin.splitlines()) > 60

    def en_sunum_var(self):
        return self.sunum_md_en.exists()

    def en_kopya(self, tur):
        """İngilizce içerik yokken İngilizce sitede de aynı dosya görünsün."""
        tr = self.dosya(tur, 'tr')
        if tr.exists():
            shutil.copyfile(tr, self.dosya(tur, 'en'))


def calistir(komut, **kw):
    # Alt süreç çıktısı boruya yönlenince Windows cp1252 kullanır ve Türkçe
    # karakterli bir log satırı mkdocs'u çökertir; UTF-8'i zorla.
    kw.setdefault('env', {**os.environ, 'PYTHONUTF8': '1', 'PYTHONIOENCODING': 'utf-8'})
    sonuc = subprocess.run(komut, capture_output=True, text=True, encoding='utf-8', errors='replace', **kw)
    if sonuc.returncode != 0:
        print('   HATA:', ' '.join(map(str, komut))[:200])
        print('  ', (sonuc.stderr or sonuc.stdout)[-800:])
    return sonuc.returncode == 0


def chrome_yolu():
    for aday in CHROME_ADAY:
        if pathlib.Path(aday).exists():
            return aday
    sys.exit('Chrome/Edge bulunamadı.')


# ---------------------------------------------------------------- tema ve iskelet
def tema_uret():
    logo = base64.b64encode((TEMA / 'rteu_logo_kucuk.jpg').read_bytes()).decode()
    sablon = (TEMA / 'cen429.tema.css.sablon').read_text(encoding='utf-8')
    (TEMA / 'cen429.css').write_text(sablon.replace('{{LOGO}}', f'data:image/jpeg;base64,{logo}'),
                                     encoding='utf-8', newline='\n')


ON_BILGI = """---
marp: true
theme: cen429
paginate: true
lang: tr
title: "{baslik}"
author: "Dr. Öğr. Üyesi Uğur CORUH"
header: "CEN429 Güvenli Programlama · {kisa}"
footer: "RTEÜ Bilgisayar Mühendisliği · 2026-2027 Güz"
---
"""


def iskelet(oge):
    if oge.sunum_md.exists():
        return
    oge.sunum_md.parent.mkdir(parents=True, exist_ok=True)
    n = int(oge.anahtar)
    tarih, oc, tr, _, konular = HAFTALAR[n]
    madde = '\n'.join(f'- {k}' for k in konular)
    metin = ON_BILGI.format(baslik=f'CEN429 Hafta {n} — {tr}', kisa=f'Hafta {n}') + f"""
<!-- _class: baslik -->
<!-- _paginate: false -->

# {tr}

**CEN429 Güvenli Programlama — Hafta {n}**

Dr. Öğr. Üyesi Uğur CORUH · {tarih}

---

# Bu hafta

{madde}

**Öğrenme çıktıları:** ÖÇ.{oc}

---

<!-- _class: bolum -->

# Sunum hazırlanıyor

Bu haftanın ayrıntılı sunumu ders notuyla birlikte yayımlanacak.
"""
    oge.sunum_md.write_text(metin, encoding='utf-8', newline='\n')
    print('   iskelet sunum:', oge.sunum_md.relative_to(KOK))


# ---------------------------------------------------------------- sunum HTML / PDF
def sunum_html(oge, dil='tr'):
    kaynak = oge.sunum_kaynak(dil)
    if kaynak is None or not kaynak.exists():
        if dil == 'tr':
            print('   sunum kaynağı yok:', oge.sunum_md.relative_to(KOK))
        return
    marp = shutil.which('marp')
    if not marp:
        sys.exit('marp bulunamadı (npm i -g @marp-team/marp-cli).')
    hedef = oge.dosya('sunum_html', dil)
    if calistir([marp, str(kaynak), '--config-file', str(SLIDES / 'marp.config.yml'),
                 '--theme-set', str(TEMA / 'cen429.css'), '--html', '-o', str(hedef)]):
        # Sunum sayfada iframe içinde gösterilir; içindeki bağlantı iframe'de açılmaya çalışır ve çoğu site
        # (GitHub vb.) buna izin vermez. Deste içi "#" atlamaları dışındaki bağlantılar yeni sekmede açılır.
        html = hedef.read_text(encoding='utf-8')
        html = re.sub(r'<a\s(?![^>]*\btarget=)([^>]*\bhref="(?!#)[^"]*"[^>]*)>',
                      r'<a target="_blank" rel="noopener" \1>', html)
        hedef.write_text(html, encoding='utf-8')
        # İngilizce deste yoksa Türkçesi İngilizce sitede de görünsün.
        if dil == 'tr' and not oge.en_sunum_var():
            oge.en_kopya('sunum_html')
        print(f'   sunum html ({dil}):', hedef.relative_to(KOK))


def sunum_pdf(oge, dil='tr'):
    if dil == 'en' and not oge.en_sunum_var():
        return
    kaynak = oge.dosya('sunum_html', dil)
    if not kaynak.exists():
        return
    hedef = oge.dosya('sunum_pdf', dil)
    chrome = chrome_yolu()
    # Marp kod bloklarını <pre is="marp-pre"> ile JavaScript'le ölçekler; bu öğe Chrome'un PDF baskısında BOŞ
    # çıkar. Baskı, öğenin kaldırıldığı geçici bir kopyadan alınır (kod satırları kısa, ölçeklemeye gerek yok).
    html = kaynak.read_text(encoding='utf-8')
    html = re.sub(r'<pre is="marp-pre"[^>]*>', '<pre>', html)
    # Baskı kopyası, göreli görsel yolları (assets/...) çözülsün diye HTML ile AYNI klasöre yazılır.
    baski = kaynak.with_name(kaynak.stem + '.baski.html')
    try:
        baski.write_text(html, encoding='utf-8')
        tamam = calistir([chrome, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                          f'--print-to-pdf={hedef}', baski.as_uri()])
    finally:
        if baski.exists():
            baski.unlink()
    if tamam:
        if dil == 'tr' and not oge.en_sunum_var():
            oge.en_kopya('sunum_pdf')
        print(f'   sunum pdf ({dil}):', hedef.relative_to(KOK))


def sunum_pptx(oge, dil='tr'):
    kaynak = oge.sunum_kaynak(dil)
    if kaynak is None or not kaynak.exists():
        return
    sys.path.insert(0, str(ARAC))
    import marp_pptx
    hedef = oge.dosya('sunum_pptx', dil)
    adet = marp_pptx.donustur(str(kaynak), str(hedef), logo=str(TEMA / 'rteu_logo_kucuk.jpg'))
    if dil == 'tr' and not oge.en_sunum_var():
        oge.en_kopya('sunum_pptx')
    print(f'   sunum pptx ({dil}): {hedef.relative_to(KOK)} ({adet} slayt)')


# ---------------------------------------------------------------- sayfa başlık bloğu
BASLA, BITIR = '<!-- materyal:basla -->', '<!-- materyal:bitis -->'


def blok(oge, dil):
    tr = dil == 'tr'
    etiket = {
        'not_pdf': ('Ders notu (PDF)', 'Lecture notes (PDF)', 'material-file-pdf-box'),
        'not_docx': ('Ders notu (DOCX)', 'Lecture notes (DOCX)', 'material-file-word-box'),
        'sunum_pdf': ('Sunum (PDF)', 'Slides (PDF)', 'material-presentation'),
        'sunum_pptx': ('Sunum (PPTX)', 'Slides (PPTX)', 'material-microsoft-powerpoint'),
        'sunum_html': ('Sunum (HTML, çevrimdışı)', 'Slides (HTML, offline)', 'material-language-html5'),
        'paket': ('Tümünü indir (ZIP)', 'Download all (ZIP)', 'material-folder-zip'),
    }
    dugmeler = []
    for alan, (e_tr, e_en, ikon) in etiket.items():
        if oge.dosya(alan, dil).exists():
            ad = oge.baglanti(alan)
            dugmeler.append(f'[:{ikon}: {e_tr if tr else e_en}]({ad}){{ .md-button download="{ad}" }}')
    sunum_var = oge.dosya('sunum_html', dil).exists()
    satirlar = [BASLA, '', '<div class="materyal" markdown>', '']
    satirlar += dugmeler
    if sunum_var:
        tam = 'Sunumu tam ekran aç' if tr else 'Open slides full screen'
        satirlar.append(f'[:material-fullscreen: {tam}]({oge.baglanti("sunum_html")})'
                        '{ .md-button .md-button--primary target=_blank }')
    satirlar += ['', '</div>', '']
    if sunum_var:
        baslik = oge.baslik_tr if tr else oge.baslik_en
        satirlar += ['<div class="sunum-cercevesi">',
                     f'<iframe src="../{oge.baglanti("sunum_html")}" title="{baslik}" loading="lazy" allowfullscreen></iframe>',
                     '</div>', '']
        ipucu = ('Sunumun içine tıklayıp ok tuşlarıyla ilerleyin; tam ekran için sunumun sağ altındaki düğmeyi ya da '
                 'yukarıdaki "Sunumu tam ekran aç" bağlantısını kullanın.') if tr else (
                 'Click inside the slides and use the arrow keys; use the button at the bottom right of the slides or the '
                 'link above for full screen.')
        satirlar += [f'<p class="sunum-ipucu">{ipucu}</p>', '']
    satirlar.append(BITIR)
    return '\n'.join(satirlar)


def basliklar(oge):
    for dil, sayfa in (('tr', oge.sayfa_tr), ('en', oge.sayfa_en)):
        if not sayfa.exists():
            continue
        metin = sayfa.read_text(encoding='utf-8')
        yeni_blok = blok(oge, dil)
        if BASLA in metin:
            metin = re.sub(re.escape(BASLA) + r'.*?' + re.escape(BITIR), lambda _: yeni_blok, metin, flags=re.S)
        elif oge.anahtar == 'izlence':
            isaret = '## Ders Bilgileri' if dil == 'tr' else '## Course Information'
            metin = metin.replace(isaret, yeni_blok + '\n\n' + isaret, 1)
        else:
            # ilk H1'den sonraki ilk tablonun bitimine ekle
            satir = metin.split('\n')
            h1 = next(i for i, s in enumerate(satir) if s.startswith('# '))
            i = h1 + 1
            while i < len(satir) and not satir[i].startswith('|'):
                i += 1
            while i < len(satir) and satir[i].startswith('|'):
                i += 1
            satir[i:i] = ['', yeni_blok]
            metin = '\n'.join(satir)
        sayfa.write_text(metin, encoding='utf-8', newline='\n')
        print(f'   başlık bloğu: {sayfa.relative_to(KOK)}')


# ---------------------------------------------------------------- site derleme ve yerel sunucu
class Site:
    """Siteyi geçici klasöre derler ve yerel bir HTTP sunucusundan yayımlar (yalnız 127.0.0.1)."""

    def __init__(self):
        self.gecici = pathlib.Path(tempfile.mkdtemp(prefix='cen429-site-'))
        print(f'[site] geçici derleme: {self.gecici}')
        if not calistir([sys.executable, '-m', 'mkdocs', 'build', '--clean', '--site-dir', str(self.gecici)], cwd=KOK):
            sys.exit('mkdocs build başarısız.')
        isleyici = functools.partial(_SessizIsleyici, directory=str(self.gecici))
        self.sunucu = http.server.ThreadingHTTPServer(('127.0.0.1', 0), isleyici)
        threading.Thread(target=self.sunucu.serve_forever, daemon=True).start()
        self.adres = f'http://127.0.0.1:{self.sunucu.server_address[1]}'

    def kapat(self):
        self.sunucu.shutdown()
        shutil.rmtree(self.gecici, ignore_errors=True)


class _SessizIsleyici(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def sayfa_yolu(oge, kok=None, dil='tr'):
    """Türkçe sayfanın derlenmiş sitedeki yolu.

    mkdocs-static-i18n, VARSAYILAN dilin sayfalarını site köküne, ötekini
    dil klasörüne (ör. `tr/`) koyar. Varsayılan dil değiştiğinde yol da
    değişir; bu yüzden sabit yazmak yerine sitede hangisi varsa o seçilir.
    """
    if oge.anahtar == 'izlence':
        son = 'syllabus/syllabus/'
    else:
        son = f'week-{oge.anahtar}/cen429-week-{oge.anahtar}/'
    if kok is None:
        return dil + '/' + son
    # Varsayılan dilin sayfaları kökte, ötekininki dil klasöründe durur.
    if (kok / son / 'index.html').exists() and not (kok / dil / son / 'index.html').exists():
        return son
    return dil + '/' + son


def logo_uri():
    veri = base64.b64encode((DOCS / 'images' / 'rteu_logo.jpg').read_bytes()).decode()
    return f'data:image/jpeg;base64,{veri}'


# ---------------------------------------------------------------- ders notu PDF (antetli)
YAZDIR_CSS = """
@page {
  size: A4;
  margin: 22mm 16mm 20mm 16mm;
  @top-left   { content: "CEN429 Güvenli Programlama"; font: 8pt 'Roboto', Arial, sans-serif; color: #5b6770; }
  @top-right  { content: "%(ust)s"; font: 8pt 'Roboto', Arial, sans-serif; color: #5b6770; }
  @bottom-left  { content: "RTEÜ Bilgisayar Mühendisliği · Dr. Öğr. Üyesi Uğur CORUH · 2026-2027 Güz";
                  font: 7.5pt 'Roboto', Arial, sans-serif; color: #5b6770; }
  @bottom-right { content: "Sayfa " counter(page) " / " counter(pages); font: 7.5pt 'Roboto', Arial, sans-serif; color: #5b6770; }
}
@page :first { @top-left { content: none; } @top-right { content: none; } }
html, body { background: #fff !important; }
.md-header, .md-tabs, .md-sidebar, .md-footer, .md-banner, .md-top, .md-source-file, .md-content__button,
.md-consent, .md-dialog, .md-feedback, .md-tags, .materyal, .sunum-cercevesi, .sunum-ipucu, .headerlink,
.md-announce, aside.md-source-file, .page-metadata, .metadata, .md-tag { display: none !important; }
.md-main__inner, .md-content, .md-content__inner, .md-grid { margin: 0 !important; max-width: none !important; }
.md-content__inner { padding: 0 !important; }
.md-content__inner > :first-child { margin-top: 0 !important; }
.md-typeset { font-size: 9.6pt; line-height: 1.5; }
.md-typeset h1 { font-size: 20pt; color: #006d77; margin: 0.2em 0 0.6em; }
.md-typeset h2 { color: #006d77; border-bottom: 1px solid #cfe3e5; padding-bottom: 2px; break-after: avoid; }
.md-typeset h3, .md-typeset h4 { break-after: avoid; }
.md-typeset pre, .md-typeset table, .md-typeset .admonition, .md-typeset details, .md-typeset .mermaid,
.md-typeset figure, .md-typeset blockquote { break-inside: avoid; }
.md-typeset pre > code { white-space: pre-wrap; word-break: break-word; }
.md-typeset table:not([class]) { font-size: 8.6pt; }
.antet { display: flex; align-items: center; gap: 12px; border-bottom: 2.5px solid #006d77;
         padding-bottom: 8px; margin-bottom: 14px; font-family: 'Roboto', Arial, sans-serif; }
.antet img { height: 58px; }
.antet .orta { flex: 1; line-height: 1.35; }
.antet .kurum { font-size: 11pt; font-weight: 700; color: #1f2d3a; letter-spacing: .3px; }
.antet .birim { font-size: 8.5pt; color: #5b6770; }
.antet .ders { font-size: 9.5pt; color: #006d77; font-weight: 600; margin-top: 2px; }
.antet .sag { text-align: right; font-size: 8.5pt; color: #5b6770; line-height: 1.4; }
.antet .sag b { color: #006d77; font-size: 10pt; }
.md-typeset .tabbed-labels { display: none !important; }
.md-typeset .tabbed-content > .tabbed-block { display: block !important; }
.md-typeset .sekme-basligi { font-weight: 700; color: #006d77; margin: 0.8em 0 0.2em; break-after: avoid; }
"""


def sekmeleri_ac(html):
    """Baskıda yalnız seçili sekme görünür; her sekmeyi kendi başlığıyla alt alta açar."""
    kuyruk = []

    def degistir(m):
        if m.group(1) is not None:                                   # sekme başlıkları: sıraya al
            kuyruk.extend(re.findall(r'<label[^>]*>(.*?)</label>', m.group(1), flags=re.S))
            return m.group(0)
        baslik = kuyruk.pop(0) if kuyruk else ''
        return m.group(0) + (f'<p class="sekme-basligi">{baslik}</p>' if baslik else '')
    return re.sub(r'<div class="tabbed-labels">(.*?)</div>|<div class="tabbed-block">', degistir, html, flags=re.S)

ANTET_EN = """<div class="antet">
<img src="%(logo)s" alt="RTEU">
<div class="orta">
<div class="kurum">RECEP TAYYİP ERDOĞAN UNIVERSITY</div>
<div class="birim">Faculty of Engineering and Architecture · Department of Computer Engineering</div>
<div class="ders">CEN429 Secure Programming · 2026-2027 Fall</div>
</div>
<div class="sag"><b>%(tur)s</b><br>%(kisa)s<br>%(tarih)s</div>
</div>"""

ANTET_HTML = """<div class="antet">
<img src="%(logo)s" alt="RTEÜ">
<div class="orta">
<div class="kurum">RECEP TAYYİP ERDOĞAN ÜNİVERSİTESİ</div>
<div class="birim">Mühendislik ve Mimarlık Fakültesi · Bilgisayar Mühendisliği Bölümü</div>
<div class="ders">CEN429 Güvenli Programlama · 2026-2027 Güz</div>
</div>
<div class="sag"><b>%(tur)s</b><br>%(kisa)s<br>%(tarih)s</div>
</div>"""


def yazdirma_sayfasi(site, oge, dil='tr'):
    """Derlenmiş sayfanın yazdırmaya uygun kopyasını üretir; adresini döndürür."""
    yol = sayfa_yolu(oge, site.gecici, dil)
    klasor = site.gecici / yol
    html = (klasor / 'index.html').read_text(encoding='utf-8')
    if oge.anahtar == 'izlence':
        if dil == 'tr':
            ust, tur, kisa, tarih = 'Ders İzlencesi', 'Ders İzlencesi', '2026-2027 Güz', 'Dr. Öğr. Üyesi Uğur CORUH'
        else:
            ust, tur, kisa, tarih = 'Syllabus', 'Syllabus', '2026-2027 Fall', 'Asst. Prof. Dr. Uğur CORUH'
    else:
        n = int(oge.anahtar)
        if dil == 'tr':
            ust, tur, kisa, tarih = f'Hafta {n} — Ders Notu', 'Ders Notu', f'Hafta {n}', HAFTALAR[n][0]
        else:
            ust, tur, kisa, tarih = f'Week {n} — Lecture Note', 'Lecture Note', f'Week {n}', HAFTALAR[n][0]
    html = re.sub(r'<details(?![^>]*\bopen\b)', '<details open', html)
    html = sekmeleri_ac(html)
    html = html.replace('</head>', f'<style>{YAZDIR_CSS % {"ust": ust}}</style></head>', 1)
    antet = (ANTET_HTML if dil == 'tr' else ANTET_EN) % {'logo': logo_uri(), 'tur': tur,
                                                          'kisa': kisa, 'tarih': tarih}
    html, n_degisim = re.subn(r'(<article class="?md-content__inner md-typeset"?>)', r'\1' + antet.replace('\\', '\\\\'),
                              html, count=1)
    if not n_degisim:
        print('   UYARI: makale başlangıcı bulunamadı, antet eklenemedi')
    (klasor / f'yazdir-{dil}.html').write_text(html, encoding='utf-8')
    return f'{site.adres}/{yol}yazdir-{dil}.html'


def not_pdf(oge, site, dil='tr'):
    if dil == 'tr' and not oge.sayfa_tr.exists():
        return
    if dil == 'en' and not oge.en_not_var():
        return
    adres = yazdirma_sayfasi(site, oge, dil)
    hedef = oge.dosya('not_pdf', dil)
    if calistir([chrome_yolu(), '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                 '--virtual-time-budget=20000', '--run-all-compositor-stages-before-draw',
                 f'--print-to-pdf={hedef}', adres]):
        if dil == 'tr' and not oge.en_not_var():
            oge.en_kopya('not_pdf')
        print(f'   ders notu pdf ({dil}):', hedef.relative_to(KOK))


# ---------------------------------------------------------------- ders notu DOCX (antetli, pandoc)
REFERANS = ARAC / 'sablon' / 'cen429-referans.docx'
RENK = '006D77'


def referans_docx():
    """pandoc'un varsayılan şablonundan antetli bir referans belge üretir (bir kez)."""
    if REFERANS.exists():
        return
    import docx
    from docx.enum.text import WD_TAB_ALIGNMENT
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor

    REFERANS.parent.mkdir(parents=True, exist_ok=True)
    ham = REFERANS.with_name('_pandoc_varsayilan.docx')
    subprocess.run(['pandoc', '-o', str(ham), '--print-default-data-file', 'reference.docx'], check=True)
    belge = docx.Document(str(ham))

    for bolum in belge.sections:
        bolum.page_width, bolum.page_height = Cm(21), Cm(29.7)
        bolum.left_margin = bolum.right_margin = Cm(2)
        bolum.top_margin, bolum.bottom_margin = Cm(2.6), Cm(2.2)
        bolum.header_distance, bolum.footer_distance = Cm(0.9), Cm(0.9)
        # Üst bilgi: logo + kurum + ders
        ust = bolum.header.paragraphs[0]
        ust.paragraph_format.tab_stops.add_tab_stop(Cm(17), WD_TAB_ALIGNMENT.RIGHT)
        ust.add_run().add_picture(str(DOCS / 'images' / 'rteu_logo.jpg'), height=Cm(1.1))
        r = ust.add_run('  RECEP TAYYİP ERDOĞAN ÜNİVERSİTESİ · Bilgisayar Mühendisliği')
        r.font.size, r.font.bold, r.font.color.rgb = Pt(8.5), True, RGBColor(0x1F, 0x2D, 0x3A)
        r = ust.add_run('\tCEN429 Güvenli Programlama')
        r.font.size, r.font.color.rgb = Pt(8.5), RGBColor.from_string(RENK)
        cizgi = OxmlElement('w:pBdr')
        alt = OxmlElement('w:bottom')
        for k, v in (('w:val', 'single'), ('w:sz', '12'), ('w:space', '4'), ('w:color', RENK)):
            alt.set(qn(k), v)
        cizgi.append(alt)
        ust._p.get_or_add_pPr().append(cizgi)
        # Alt bilgi: ders bilgisi + sayfa numarası
        alt_p = bolum.footer.paragraphs[0]
        alt_p.paragraph_format.tab_stops.add_tab_stop(Cm(17), WD_TAB_ALIGNMENT.RIGHT)
        r = alt_p.add_run('Dr. Öğr. Üyesi Uğur CORUH · 2026-2027 Güz\tSayfa ')
        r.font.size, r.font.color.rgb = Pt(8), RGBColor(0x5B, 0x67, 0x70)
        for parca in ('begin', 'PAGE', 'end'):
            r = alt_p.add_run()
            r.font.size = Pt(8)
            if parca == 'PAGE':
                el = OxmlElement('w:instrText')
                el.set(qn('xml:space'), 'preserve')
                el.text = 'PAGE'
            else:
                el = OxmlElement('w:fldChar')
                el.set(qn('w:fldCharType'), parca)
            r._r.append(el)

    stiller = belge.styles
    def ayarla(ad, boyut=None, renk=None, kalin=None, font=None):
        try:
            s = stiller[ad]
        except KeyError:
            return
        if font:
            s.font.name = font
            s.element.rPr.rFonts.set(qn('w:eastAsia'), font)
        if boyut:
            s.font.size = Pt(boyut)
        if renk:
            s.font.color.rgb = RGBColor.from_string(renk)
        if kalin is not None:
            s.font.bold = kalin
    for ad in ('Normal', 'Body Text', 'First Paragraph', 'Compact'):
        ayarla(ad, 10.5, None, None, 'Calibri')
    ayarla('Title', 22, RENK, True, 'Calibri')
    ayarla('Heading 1', 17, RENK, True, 'Calibri')
    ayarla('Heading 2', 14, RENK, True, 'Calibri')
    ayarla('Heading 3', 12, '1F2D3A', True, 'Calibri')
    ayarla('Heading 4', 11, '1F2D3A', True, 'Calibri')
    ayarla('Source Code', 8.5, None, None, 'Consolas')
    ayarla('Verbatim Char', 9, 'A1123F', None, 'Consolas')
    # Bilgi kutuları (Block Text): sol çizgi + açık zemin
    try:
        bt = stiller['Block Text']
        ppr = bt.element.get_or_add_pPr()
        kenar = OxmlElement('w:pBdr')
        sol = OxmlElement('w:left')
        for k, v in (('w:val', 'single'), ('w:sz', '18'), ('w:space', '8'), ('w:color', RENK)):
            sol.set(qn(k), v)
        kenar.append(sol)
        ppr.append(kenar)
        zemin = OxmlElement('w:shd')
        for k, v in (('w:val', 'clear'), ('w:color', 'auto'), ('w:fill', 'EEF7F8')):
            zemin.set(qn(k), v)
        ppr.append(zemin)
        bt.font.italic = False
    except KeyError:
        pass
    # Tablolar: ince kenarlıklar
    try:
        tablo = stiller['Table']
        tblpr = tablo.element.find(qn('w:tblPr'))
        if tblpr is None:
            tblpr = OxmlElement('w:tblPr')
            tablo.element.append(tblpr)
        kenarlar = OxmlElement('w:tblBorders')
        for k in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            e = OxmlElement(f'w:{k}')
            for a, v in (('w:val', 'single'), ('w:sz', '4'), ('w:space', '0'), ('w:color', 'B7CFD2')):
                e.set(qn(a), v)
            kenarlar.append(e)
        tblpr.append(kenarlar)
    except KeyError:
        pass
    belge.save(str(REFERANS))
    ham.unlink()
    print('   referans docx:', REFERANS.relative_to(KOK))


def mermaid_png(site, kod, hedef):
    """Mermaid kodunu yerel sunucudaki geçici bir sayfada çizip PNG olarak kaydeder (kırpılmış)."""
    from PIL import Image, ImageChops
    klasor = site.gecici / '_mermaid'
    klasor.mkdir(exist_ok=True)
    sayfa = klasor / (hedef.stem + '.html')
    guvenli = kod.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    sayfa.write_text(
        '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff}'
        '#d{display:inline-block;padding:12px}</style></head><body><div id="d"><pre class="mermaid">'
        + guvenli + '</pre></div><script type="module">import m from '
        '"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";'
        'm.initialize({startOnLoad:true,theme:"default",fontFamily:"Arial",'
        'flowchart:{useMaxWidth:false,htmlLabels:true}});</script></body></html>',
        encoding='utf-8')
    calistir([chrome_yolu(), '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1400,1800',
              '--force-device-scale-factor=2', '--virtual-time-budget=10000', f'--screenshot={hedef}',
              f'{site.adres}/_mermaid/{sayfa.name}'])
    if not hedef.exists():
        return None
    img = Image.open(hedef).convert('RGB')
    kutu = ImageChops.difference(img, Image.new('RGB', img.size, (255, 255, 255))).getbbox()
    if kutu:
        img = img.crop((max(kutu[0] - 10, 0), max(kutu[1] - 10, 0), kutu[2] + 10, kutu[3] + 10))
    img.save(hedef)
    return img.size


def docx_on_isle(metin, site, gecici, sayfa_klasor=None):
    """MkDocs'a özgü sözdizimini pandoc'un anlayacağı Markdown'a çevirir."""
    metin = re.sub(r'\A---\n.*?\n---\n', '', metin, flags=re.S)                     # ön bilgi
    metin = re.sub(re.escape(BASLA) + r'.*?' + re.escape(BITIR), '', metin, flags=re.S)  # indirme/iframe bloğu
    metin = re.sub(r'\{ *\.md-button[^}]*\}', '', metin)

    # Yerel görseller (assets/...): SVG yerine PNG kardeşi geçici klasöre kopyalanır
    # (pandoc/Word SVG'yi güvenilir gömemez). Mermaid'den ÖNCE çalışır ki onun
    # ürettiği PNG bağlantıları bu adımdan etkilenmesin.
    def yerel_gorsel(m):
        from PIL import Image as _Im
        alt, yol = m.group(1), m.group(2)
        if yol.startswith(('http://', 'https://', 'data:')) or sayfa_klasor is None:
            return m.group(0)
        kaynak = pathlib.Path(sayfa_klasor) / yol
        png = kaynak.with_suffix('.png')
        if not png.exists():
            png = kaynak
        if not png.exists():
            return '*(görsel ders sayfasında)*'
        hedef = gecici / png.name
        if not hedef.exists():
            shutil.copy2(png, hedef)
        try:
            with _Im.open(hedef) as im:
                gw = im.size[0]
            genislik = min(16.0, gw / 2 * 2.54 / 96)
        except Exception:
            genislik = 15.0
        return f'![{alt}]({hedef.name}){{width={genislik:.1f}cm}}'
    metin = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', yerel_gorsel, metin)

    # Mermaid → PNG
    sayac = [0]

    def mermaid(m):
        sayac[0] += 1
        png = gecici / f'diyagram-{sayac[0]}.png'
        boyut = mermaid_png(site, m.group(1), png)
        if not boyut:
            return '*(diyagram web sayfasında)*'
        genislik = min(16.0, boyut[0] / 2 * 2.54 / 96)
        return f'![]({png.name}){{width={genislik:.1f}cm}}'
    metin = re.sub(r'```mermaid\n(.*?)\n```', mermaid, metin, flags=re.S)

    # Kod bloğu başlıkları: ```c title="x"  ->  **x** + ```c
    metin = re.sub(r'^(\s*)```(\w+) +title="([^"]+)"', r'\1**\3**\n\n\1```\2', metin, flags=re.M)

    # Bilgi kutuları (!!!, ???, ???+) → başlıklı alıntı; sekmeler (=== "Başlık") → kalın başlık + içerik.
    # İç içe olanlar da açılır.
    def kutular(satirlar):
        cikti, i = [], 0
        desen = re.compile(r'^(\s*)(!!!|\?\?\?\+?)\s+(\w+)(?:\s+"([^"]*)")?\s*$')
        sekme = re.compile(r'^(\s*)===\+?\s+"([^"]*)"\s*$')
        while i < len(satirlar):
            m = desen.match(satirlar[i])
            s = None if m else sekme.match(satirlar[i])
            if not m and not s:
                cikti.append(satirlar[i])
                i += 1
                continue
            girinti = len((m or s).group(1))
            govde, i = [], i + 1
            while i < len(satirlar) and (not satirlar[i].strip() or
                                         len(satirlar[i]) - len(satirlar[i].lstrip()) >= girinti + 4):
                govde.append(satirlar[i][girinti + 4:] if satirlar[i].strip() else '')
                i += 1
            while govde and not govde[-1]:
                govde.pop()
            govde = kutular(govde)
            if s:
                onek = ' ' * girinti
                cikti += [onek + f'**{s.group(2)}**', '']
                cikti += [(onek + g) if g else '' for g in govde]
                cikti.append('')
                continue
            baslik = m.group(4) or m.group(3).capitalize()
            onek = ' ' * girinti + '> '
            cikti.append(onek + f'**{baslik}**')
            cikti.append(onek.rstrip())
            cikti += [(onek + g) if g else onek.rstrip() for g in govde]
            cikti.append('')
        return cikti
    metin = '\n'.join(kutular(metin.split('\n')))
    metin = re.sub(r'<p class="sunum-ipucu">.*?</p>', '', metin, flags=re.S)
    return metin


def not_docx(oge, site, dil='tr'):
    if dil == 'tr' and not oge.sayfa_tr.exists():
        return
    if dil == 'en' and not oge.en_not_var():
        return
    kaynak_sayfa = oge.sayfa_tr if dil == 'tr' else oge.sayfa_en
    referans_docx()
    gecici = pathlib.Path(tempfile.mkdtemp(prefix='cen429-docx-'))
    try:
        md = docx_on_isle(kaynak_sayfa.read_text(encoding='utf-8'), site, gecici,
                          sayfa_klasor=kaynak_sayfa.parent)
        kaynak = gecici / 'not.md'
        kaynak.write_text(md, encoding='utf-8')
        hedef = oge.dosya('not_docx', dil)
        if oge.anahtar == 'izlence':
            baslik = ('CEN429 Güvenli Programlama — Ders İzlencesi' if dil == 'tr'
                      else 'CEN429 Secure Programming — Syllabus')
        else:
            baslik = oge.baslik_tr if dil == 'tr' else oge.baslik_en
        if calistir(['pandoc', str(kaynak), '-f', 'markdown+pipe_tables+grid_tables+fenced_code_attributes'
                     '+link_attributes+raw_html-implicit_figures', '-t', 'docx', '--reference-doc', str(REFERANS),
                     '--resource-path', str(gecici), '--metadata', f'title-meta={baslik}', '-o', str(hedef)]):
            if dil == 'tr' and not oge.en_not_var():
                oge.en_kopya('not_docx')
            print(f'   ders notu docx ({dil}):', hedef.relative_to(KOK))
    finally:
        shutil.rmtree(gecici, ignore_errors=True)


# ---------------------------------------------------------------- çevrimdışı paket (ZIP)
def paket(oge, dil='tr'):
    """Haftanın bütün materyalini ve demo kodlarını tek ZIP'te toplar (derleme çıktıları hariç)."""
    import zipfile
    hedef = oge.dosya('paket', dil)
    kok_ad = oge.ad
    # .gitignore ile aynı: derleme/çalışma çıktıları ve hazirla betiklerinin indirdiği üçüncü taraf dosyaları pakete girmez
    atla = {'bin', 'dokum', 'build', '__pycache__', 'cikti', 'lib'}
    with zipfile.ZipFile(hedef, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for tur in ('sunum_html', 'sunum_pdf', 'sunum_pptx', 'not_pdf', 'not_docx'):
            dosya = oge.dosya(tur, dil)
            if dosya.exists():
                z.write(dosya, f'{kok_ad}/{oge.baglanti(tur)}')
        kod = oge.kod_klasoru
        if kod and kod.exists():
            # Haftanın demoları + derlemek için gereken ortak altyapı (kök CMake, betikler, cmake/, common/):
            # ZIP açıldığında code/ klasörü kendi başına derlenir.
            kod_koku = kod.parent
            ortak = [kod_koku / ad for ad in ('CMakeLists.txt', 'CMakePresets.json', 'build.ps1', 'build.sh',
                                               'README.md', 'README.en.md', '.gitattributes')]
            for klasor in (kod_koku / 'cmake', kod_koku / 'common', kod):
                ortak += sorted(klasor.rglob('*'))
            for yol in ortak:
                parcalar = set(yol.relative_to(kod_koku).parts)
                if (yol.is_file() and not (parcalar & atla) and yol.name.lower() != 'desktop.ini'
                        and yol.suffix.lower() != '.jar'):
                    z.write(yol, f'{kok_ad}/code/{yol.relative_to(kod_koku).as_posix()}')
    print(f'   paket: {hedef.relative_to(KOK)} ({hedef.stat().st_size // 1024} KB)')


# ---------------------------------------------------------------- ana akış
ADIMLAR = ['iskelet', 'sunum', 'sunum-pdf', 'pptx', 'not-pdf', 'docx', 'paket', 'basliklar']


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('adimlar', nargs='+', choices=ADIMLAR + ['hepsi'])
    ap.add_argument('--hafta', help='virgülle haftalar ve/veya "izlence" (varsayılan: hepsi)')
    arg = ap.parse_args()
    adimlar = ADIMLAR if 'hepsi' in arg.adimlar else arg.adimlar
    anahtarlar = arg.hafta.split(',') if arg.hafta else ['izlence'] + [str(n) for n in HAFTALAR]
    tema_uret()
    ogeler = [Oge(a.strip()) for a in anahtarlar]
    site = None
    for adim in ADIMLAR:
        if adim not in adimlar:
            continue
        if adim in ('not-pdf', 'docx'):
            site = Site()
        print(f'== {adim}')
        for oge in ogeler:
            if adim == 'iskelet' and oge.anahtar != 'izlence':
                iskelet(oge)
            elif adim == 'sunum':
                sunum_html(oge)
                sunum_html(oge, 'en')
            elif adim == 'sunum-pdf':
                sunum_pdf(oge)
                sunum_pdf(oge, 'en')
            elif adim == 'pptx':
                sunum_pptx(oge)
                sunum_pptx(oge, 'en')
            elif adim == 'not-pdf':
                not_pdf(oge, site)
                not_pdf(oge, site, 'en')
            elif adim == 'docx':
                not_docx(oge, site)
                not_docx(oge, site, 'en')
            elif adim == 'paket':
                paket(oge)
                paket(oge, 'en')
            elif adim == 'basliklar':
                basliklar(oge)
        if site:
            site.kapat()
            site = None


if __name__ == '__main__':
    main()
