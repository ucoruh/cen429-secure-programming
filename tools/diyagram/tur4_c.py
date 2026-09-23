# -*- coding: utf-8 -*-
"""7. tur (c) — derinleştirilmiş H4, H5, H6 notlarında görselsiz kalan bölümler."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cizim import *

KOK = None
def yol(h): return os.path.join(KOK, "week-%d" % h, "assets")


# ===================================================== HAFTA 4
def h04_15(k):
    fig, ax = akis(
        [("Kural kimliği", ["INT30-C", "alan + sıra"], "mor"),
         ("Hatalı kod", ["standardın verdiği", "gerçek hata örneği"], "kotu"),
         ("Uyumlu kod", ["aynı işi güvenle", "yapan sürüm"], "iyi"),
         ("Risk değerlendirmesi", ["ciddiyet · olasılık", "düzeltme maliyeti"], "uyari")],
        "SEI CERT kuralının anatomisi",
        "her kural aynı dört parçayla gelir",
        dip="Kuralı ezberlemeyin: hatalı ile uyumlu kodun FARKINI okuyun; öğretici olan orasıdır.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h04-15-cert-kural-anatomisi")


def h04_16(k):
    fig, ax = tuval(12.0, 5.6)
    baslik(ax, "Bu haftanın CERT kural çiftleri", "her biri bir demoya karşılık gelir")
    kurallar = [("INT30-C", "işaretsiz tamsayı sarması", "Demo 3"),
                ("INT31-C", "tür dönüşümünde veri kaybı", "Demo 3"),
                ("STR31-C", "hedef tampon sonlandırıcıyı almalı", "Demo 1"),
                ("MEM30-C", "serbest bırakılmış belleği kullanma", "Demo 2"),
                ("MEM31-C", "her ayrılan bellek serbest bırakılır", "Demo 2"),
                ("FIO30-C", "kullanıcı girdisini biçim dizisi yapma", "Demo 1")]
    for i, (kod, aciklama, demo) in enumerate(kurallar):
        y = 72 - i * 10.5
        kutu(ax, 16, y, 20, 8.6, kod, dolgu=MORBG, kenar=MOR, bas_boyut=11.5)
        ax.text(29, y, aciklama, ha="left", va="center", fontsize=10.2, color=YAZI)
        ax.text(96, y, demo, ha="right", va="center", fontsize=9.6, color=SOLUK)
    serit(ax, 7, "Kural kimliğini proje belgenize yazın: denetleyiciye \"hangi kurala uydum\" diye cevap verirsiniz.")
    return kaydet(fig, k, "h04-16-cert-kural-ciftleri")


def h04_17(k):
    fig, ax = iki_yol(
        "Uzak saldırgan mı, cihazın sahibi mi?",
        ("UZAK SALDIRGAN", ["girdi gönderir", "belleği göremez",
                            "bellek güvenliği + doğrulama yeter", "1–5. haftalar"], "ana"),
        ("CİHAZIN SAHİBİ (MATE)", ["ikiliyi elinde tutar", "hata ayıklayıcı bağlar",
                                    "gizleme + RASP gerekir", "6., 9., 14. haftalar"], "kotu"),
        alt_metin="aynı programa iki farklı tehdit modeli",
        dip="Gizlemeye buradan geçiyoruz: bellek güvenliği ikinci saldırgana karşı yetmez.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h04-17-iki-saldirgan-modeli")


def h04_18(k):
    fig, ax = akis(
        [("Semboller", ["fonksiyon adları", "strip ile kaldırılır"], "ana"),
         ("Dizeler", ["sabit metinler", "kodlanarak saklanır"], "ana"),
         ("Günlükler", ["sürüm derlemesinde", "kapatılır"], "iyi"),
         ("Kalan", ["saldırgan artık", "anlam aramak zorunda"], "mor")],
        "Sembol, dize ve günlük gizleme: ilk savunma hattı",
        "tersine mühendisliğin en ucuz adımını pahalılaştırmak",
        dip="En ucuz koruma budur ve çoğu projede eksiktir: strings çıktınızı bir kez okuyun.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h04-18-sembol-dize-gizleme")


def h04_19(k):
    fig, ax = iki_yol(
        "Kontrol akışı düzleştirme ve opak değerler",
        ("ÖNCE", ["if / else / while", "grafik okunabilir",
                  "algoritmanın iskeleti görünür", "birkaç temel blok"], "iyi"),
        ("SONRA", ["tek switch + durum değişkeni", "sıra değişkende saklı",
                   "opak yüklemler sahte dal ekler", "çok sayıda blok"], "kotu"),
        alt_metin="aynı davranış, okunamaz grafik",
        dip="Maliyeti vardır: boyut ve hız artar. 9. ve 14. haftada ölçmeyi öğreneceğiz.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h04-19-duzlestirme-giris")


# ===================================================== HAFTA 5
def h05_11(k):
    fig, ax = akis(
        [("Kural kimliği", ["IDS00-J, SER01-J", "alan + sıra"], "mor"),
         ("Hatalı kod", ["yönetilen dilde de", "aynı hata"], "kotu"),
         ("Uyumlu kod", ["API'nin güvenli", "kullanımı"], "iyi"),
         ("Risk", ["ciddiyet · olasılık", "· düzeltme"], "uyari")],
        "SEI CERT Oracle Java: aynı yapı, farklı dil",
        "yönetilen dil bellek hatasını çözer, mantık hatasını çözmez",
        dip="IDS (girdi doğrulama), SER (serileştirme), FIO (dosya), MSC (çeşitli) — enjeksiyon konuları IDS'tedir.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h05-11-cert-java")


def h05_12(k):
    fig, ax = katman(
        "Yorumlanan dillerde aynı hatalar",
        [("eval / exec", "dizeyi KOD olarak çalıştırır — girdiyle asla birleştirilmez", "kotu"),
         ("pickle / unserialize", "veriyi nesneye çevirirken kod çağırır — güvenilmez veride kullanılmaz", "kotu"),
         ("os.system / shell=True", "kabuk ayrıştırır — argüman dizisi kullanın", "kotu"),
         ("Düzenli ifade (ReDoS)", "geri izleme üstel büyür — desen ve girdi uzunluğu sınırlanır", "uyari")],
        alt_metin="Python, JavaScript, Ruby, PHP — kök aynı: veri ile kodun karışması",
        dip="Dil değişir, kural değişmez: girdiyi asla yorumlayıcıya kod olarak verme.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h05-12-yorumlanan-diller")


def h05_13(k):
    fig, ax = akis(
        [("Düz sabit", ["\"sunucu-anahtari\"", "strings ile görünür"], "kotu"),
         ("Kodlanmış sabit", ["XOR / tablo ile", "saklanır"], "uyari"),
         ("Çalışma anında çöz", ["kullanım anında,", "kısa süre bellekte"], "ana"),
         ("Dinamik çağrı", ["yansıma (reflection) ile", "ad ikilide görünmez"], "mor")],
        "Dize gizleme ve dinamik yöntem çağrısı",
        "iki basit yöntem, iki farklı izi siler",
        dip="Bu bir şifreleme değil, bir GECİKTİRMEdir: anahtar da ikilidedir, bulunabilir.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h05-13-dize-gizleme")


def h05_14(k):
    fig, ax = adimlar(
        "Android'de R8 ve gizlemenin etkisini ölçmek",
        [("minifyEnabled", ["build.gradle'da", "açılır"], "ana"),
         ("Kurallar", ["-keep ile ne", "korunacak yazılır"], "ana"),
         ("Derle", ["R8 küçültür,", "gizler, iyileştirir"], "iyi"),
         ("mapping.txt", ["saklanır — çökme", "raporu için şart"], "uyari"),
         ("Ölç", ["boyut, sınıf/alan", "adı okunabilirliği"], "mor"),
         ("Test et", ["yansıma bozuldu mu?"], "kotu")],
        alt_metin="ölçmediğiniz gizleme bir iddiadır",
        dip="mapping.txt kaybolursa üretimdeki çökme raporlarını bir daha çözemezsiniz.",
        satir_basina=3, g=11.5, y=5.4)
    return kaydet(fig, k, "h05-14-r8-olcme")


# ===================================================== HAFTA 6
def h06_13(k):
    fig, ax = katman(
        "Dinamik bellek koruması: hangi katman neyi kapatır?",
        [("Döküm kapatma", "PR_SET_DUMPABLE=0 — çökme dökümünde sır kalmaz", "ana"),
         ("Bellek kilidi", "mlock — sır takas alanına yazılmaz", "ana"),
         ("Kısa ömür + silme", "explicit_bzero — pencere daralır", "iyi"),
         ("Bütünlük sayacı", "korunan değer yanında sağlama tutulur; değişirse yakalanır", "mor"),
         ("İzleme tespiti", "ptrace / okuma denemesi algılanır ve puana katılır", "uyari")],
        alt_metin="bellek saldırganın en kolay ulaştığı yerdir",
        dip="Hiçbiri tek başına yetmez; her biri saldırganın bir yolunu pahalılaştırır.",
        g=11.5, y=5.4)
    return kaydet(fig, k, "h06-13-bellek-koruma-katmanlari")


def h06_14(k):
    fig, ax = akis(
        [("Gösterge topla", ["root izleri, imza,", "paket adı"], "ana"),
         ("Puana çevir", ["her gösterge ağırlıklı", "— tek başına karar YOK"], "ana"),
         ("Eşikle karşılaştır", ["ürünün risk iştahına", "göre ayarlanır"], "uyari"),
         ("Derecelendirilmiş tepki", ["kısıtla · sunucuya bildir", "· sessizce sınırla"], "iyi")],
        "Kök/ayrıcalıklı ortam: göstergeden karara",
        "tek göstergeyle engellemek meşru kullanıcıyı vurur",
        dip="Root'lu cihaz suçlu değildir; yalnızca güvence düzeyi düşüktür. Tepkiyi ona göre ölçekleyin.",
        g=12.0, y=4.6)
    return kaydet(fig, k, "h06-14-kok-gosterge-karar")


def h06_15(k):
    fig, ax = iki_yol(
        "RASP'in sınırları: ne vaat eder, ne etmez?",
        ("ETMEZ", ["kırılmazlık", "MATE'ye karşı kalıcı engel",
                   "kötü mimariyi kurtarma", "meşru kullanıcıyı ayırt etme garantisi"], "kotu"),
        ("EDER", ["saldırıyı geciktirir", "toplu kırılmayı zorlaştırır",
                  "telemetriyle görünürlük", "riskli ortamda kapsamı daraltır"], "iyi"),
        alt_metin="cihazın sahibi saldırgansa yeterli zamanla her katman aşılır",
        dip="Etik sınır: kullanıcının cihazına zarar vermeyin, veri toplamayı şeffaf ve ölçülü tutun.",
        g=11.5, y=5.0)
    return kaydet(fig, k, "h06-15-rasp-sinirlari")


ISLER = {4: [h04_15, h04_16, h04_17, h04_18, h04_19],
         5: [h05_11, h05_12, h05_13, h05_14],
         6: [h06_13, h06_14, h06_15]}

if __name__ == "__main__":
    KOK = sys.argv[1]
    n = 0
    for h, fnlar in ISLER.items():
        for fn in fnlar:
            fn(yol(h)); n += 1
    print("üretilen:", n)
    rapor()
