#!/bin/sh
# CEN429 — Hafta 2 — Demo 1: imza, polimorfizm, sezgisel analiz, emulasyon
# Önce derleyin: ../../build.sh     Sonra: sh demo.sh
# Program yalnız okur; hiçbir dosyayı değiştirmez, silmez, çalıştırmaz.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/tarayici" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
I=imzalar.txt
O=cikti
T="$B/tarayici"
cizgi() { echo "--------------------------------------------------------------"; }

mkdir -p "$O"
"$B/ornek_uret" "$O" >/dev/null

cizgi; echo "ADIM 1 — Laboratuvar yakalanan ornegi inceler: ozet ve entropi"
"$T" ozet "$I" "$O/ornek_a.bin"
echo "  Imza veritabanindaki kayitlar:"
grep -v '^#' "$I" | cut -c1-64 | sed 's/^/    /'

cizgi; echo "ADIM 2 — Hash (ozet) imzasi: birebir ayni dosyayi yakalar"
"$T" hash "$I" "$O/temiz.txt" "$O/ornek_a.bin" "$O/ornek_a_1bayt.bin"
echo "   ^ Tek bir bayt degisince ozet bambaska: hash imzasi atlatildi."

cizgi; echo "ADIM 3 — Desen (bayt dizisi) imzasi: kucuk degisikliklere dayanikli"
"$T" desen "$I" "$O/ornek_a.bin" "$O/ornek_a_1bayt.bin" \
    "$O/poli_1.bin" "$O/poli_2.bin" "$O/poli_3.bin"
echo "   ^ poli_1/poli_2 cozucu deseniyle yakalandi; cozucusu"
echo "     degisen poli_3 hic yakalanamadi (polimorfizm)."

cizgi; echo "ADIM 4 — Ayni govde, farkli anahtar: sifreli kopyalar hic benzemiyor"
"$T" govde16 "$I" "$O/poli_1.bin" "$O/poli_2.bin" "$O/poli_3.bin"

cizgi; echo "ADIM 5 — Sezgisel analiz: imza yok, supheli ozelliklere puan ver"
"$T" sezgisel "$I" "$O/temiz.txt" "$O/ornek_a.bin" "$O/poli_1.bin" \
    "$O/poli_3.bin" "$O/arsiv.bin"
echo "   ^ arsiv.bin zararsiz yuksek-entropili dosya: YANLIS POZITIF."
echo "     ornek_a.bin ise sezgisel olarak gozden kacti (yanlis negatif)."

cizgi; echo "ADIM 6 — Emulasyon: cozucuyu guvenli ortamda calistir, sonra tara"
"$T" emulasyon "$I" "$O/temiz.txt" "$O/ornek_a.bin" "$O/poli_1.bin" \
    "$O/poli_2.bin" "$O/poli_3.bin" "$O/arsiv.bin"

cizgi; echo "Sonuc: tek yontem yetmez; tarayicilar katmanli calisir."
