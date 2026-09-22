# Hafta 10 · Demo 1 — OpenSSL ile sertifika zinciri

Kök → ara → sunucu sertifika zinciri kurar ve **zincir doğrulamayı** gösterir:
ara sertifika olmadan `verify` başarısız ("unable to get local issuer"), ara ile **OK**.

## Çalıştırma
```sh
sh demo.sh        # openssl gerekir (1.1.1+ / 3.x)
```

## Güvenlik
Yalnız bu klasörde geçici `pki/` üretir ve **sonunda siler**. Ağa çıkmaz, hiçbir sertifika
sisteme kurulmaz, sudo yoktur. Windows Git-Bash için `MSYS_NO_PATHCONV=1` ayarlıdır.
