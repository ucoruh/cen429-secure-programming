# Demo 3 — Ortam algılama: sanal makine / emülatör + zamanlama

**Konu:** RASP algılama — emülatör/VM tespiti, zamanlama tabanlı anti-analiz · **Hafta:** 6

## Ne gösteriyor?

Analiz çoğu zaman bir sanal makine ya da emülatör içinde yapılır. Program bunu **taşınabilir ve güvenli** iki teknikle
sezer:

- **(A) CPUID:** yaprak 1'de ECX bit 31 "hypervisor present" bitidir (bare-metal'de 0). Hipervizör varsa yaprak
  `0x40000000` 12 karakterlik satıcı imzasını verir (`KVMKVMKVM`, `VMwareVMware`, `Microsoft Hv`, `VBoxVBoxVBox`...).
- **(B) Zamanlama:** aynı işlem ölçülür; tek adımlı hata ayıklama ya da ağır emülasyon büyük yavaşlama yaratır. Eşik
  makineye göre değiştiği için demo yalnızca **ölçüp raporlar**, kesin karar vermez.

## Önemli ders notu

WSL2, Hyper-V ve sanallaştırma tabanlı güvenlik (VBS) yüzünden **çoğu modern Windows makinesi "hipervizör var"** der.
Yani bu bit tek başına "analiz ortamı" anlamına gelmez — **zayıf bir sinyaldir**. Bu, RASP'in temel dersini gösterir:
tek bir göstergeye asla güvenme.

## Çalıştırma

Önce `code/` klasöründe derleyin. Sonra bu klasörde: Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`.

## Neden güvenli?

Yalnız bir CPU komutu (`CPUID`) çalıştırır ve saat okur. Ağ yok, dosya yok, sistem ayarı yok.

## Kendiniz deneyin

1. Aynı ikili dosyayı bare-metal Linux'ta ve bir VM (VirtualBox/KVM) içinde çalıştırın. Satıcı imzası değişiyor mu?
2. Bir uygulama sırf hipervizör gördüğü için çalışmayı reddetse ne olurdu? (İpucu: WSL2/VBS kullanan meşru
   kullanıcıları da engellerdi — yanlış pozitif.)
3. Zamanlama ölçümünü tek adımlı hata ayıklayıcı altında çalıştırın (Demo 2). Süre nasıl değişiyor?
