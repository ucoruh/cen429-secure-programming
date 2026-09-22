#!/bin/sh
# CEN429 — Hafta 1 — Demo 3: Arabellek taşmasıyla yetki yükseltme (Linux / WSL)
# Önce derleyin: ../../build.sh     Sonra: ./demo.sh
# Çökmesi beklenen programlar yalnız o komut için sınırlandırılarak çalıştırılır:
#   prlimit --core=1:1  -> çökme dökümü oluşmaz (WSL'nin çökme yakalayıcısı dahil)
#   timeout 20          -> hiçbir demo takılı kalmaz
#   setarch ... -R      -> yalnız bu süreç için adres rastgeleleştirmesi kapalı (eski GCC'nin ASan
#                          kütüphanesi yeni çekirdeklerde bunu ister); sistem ayarı değişmez
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/giris" ] || { echo "Once derleyin: ../../build.sh"; exit 1; }
CALISTIR="prlimit --core=1:1 timeout 20"
ASAN="$CALISTIR setarch $(uname -m) -R"
KISA=AAAAAAAAAAAAAAAAB                          # 16 karakter + 'B' (0x42)
UZUN=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA   # 40 karakter: yapının dışına taşar
cizgi() { echo "--------------------------------------------------------------"; }

cizgi; echo "ADIM 1 — Normal giris";                          echo "\$ ./$B/giris ayse"; "./$B/giris" ayse
cizgi; echo "ADIM 2 — Saldiri: 16 bayttan 1 bayt fazla ad (17 karakter)"
echo "\$ ./$B/giris $KISA"; "./$B/giris" "$KISA"
cizgi; echo "ADIM 3 — Ayni saldiri, AddressSanitizer ile derlenmis surumde"
echo "\$ ./$B/giris_asan $KISA"; $ASAN "./$B/giris_asan" "$KISA"
echo "   ^ ASan sessiz kaldi: tasma yapinin ICINDE kaldi."
echo "     (ad -> yonetici; araclarin da siniri var)"
cizgi; echo "ADIM 4 — Yapinin disina tasan uzun ad, ASan surumu"
echo "\$ ./$B/giris_asan <40 karakter>"
$ASAN "./$B/giris_asan" "$UZUN" 2>&1 | grep -E 'ERROR|WRITE of size|SUMMARY' || true
cizgi; echo "ADIM 5 — Ayni kisa saldiri, _FORTIFY_SOURCE=2 ile derlenmis surumde"
echo "\$ ./$B/giris_denetimli $KISA"
$CALISTIR "./$B/giris_denetimli" "$KISA" 2>&1 || echo "   (program, derleyicinin ekledigi denetimle durduruldu)"
cizgi; echo "ADIM 6 — Duzeltilmis surum"
echo "\$ ./$B/giris_guvenli $KISA"; "./$B/giris_guvenli" "$KISA" || true
echo "\$ ./$B/giris_guvenli ayse";  "./$B/giris_guvenli" ayse
