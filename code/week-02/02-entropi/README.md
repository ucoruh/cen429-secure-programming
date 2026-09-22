# Demo 02 — Entropi ölçer: şifreli ve paketlenmiş içerik nasıl anlaşılır?

**Konu:** Zararlı yazılımların gizlenme yöntemleri (şifreleme, paketleme) ve sezgisel tespit ·
**Hafta:** 2 · **Kitap:** Viega & Messier, Tarif 12.1 (yazılım korumasının sorunu)

## Ne gösteriyor?

Shannon entropisi bir veri parçasındaki bayt değerlerinin ne kadar karışık dağıldığını ölçer (0 ile 8 bit/bayt
arası). Düz metin ve kaynak kod 4–5 bit civarında kalır; derlenmiş programlar 5–7 arasındadır; şifreli,
sıkıştırılmış ya da rastgele veri 8'e çok yakındır. Antivirüsler bu ölçüyü "paketlenmiş/şifreli kod" belirtisi,
EDR ürünleri ise "dosyaları hızla şifreleyen süreç" (fidye yazılımı) belirtisi olarak kullanır.

Örnek dosyalar `uret` programı tarafından iki platformda da aynı biçimde üretilir (harici `gzip`/`openssl`
gerekmez): tekdüze, düz metin, makine kodu benzeri sentetik veri, AES-256-GCM ile şifreli ve yüksek entropili
rastgele dosyalar.

| Adım | Ne oluyor? |
| --- | --- |
| 1 | Tekdüze, metin, makine kodu benzeri, şifreli ve rastgele verinin entropisi karşılaştırılır |
| 2 | Aynı içeriğin düz, makine-kodu-benzeri ve şifreli hali ölçülür |
| 3 | Metnin ortasına şifreli bir bölüm gizlenmiş "karma" dosya 512 baytlık pencerelerle taranır |
| 4 | Bir dosya "yerinde" şifrelenince entropinin nasıl sıçradığı gösterilir |

## Çalıştırma

Önce bütün demoları bir kez derleyin (`code/` klasöründe): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **Dosya > Aç > Klasör** → `code` → yapılandırmayı seçin → **Derle > Tümünü Derle**. Sonra bu
klasörde:

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Kendi dosyalarınızı da ölçebilirsiniz: `.\bin\windows\entropi.exe dosya1 dosya2` (Windows) ya da
`./bin/linux/entropi -p 1024 dosya` (pencereli harita, Linux).

## Neden güvenli?

Program yalnız **okur**. Örnekler bu klasördeki `cikti/` altında üretilir; şifreleme için işletim sisteminin kendi kripto
kütüphanesi sabit bir demo anahtarıyla kullanılır (anahtar gizli bir değer değildir, hiçbir gerçek veriyi korumaz).

## Kendin dene

- Kendi bilgisayarınızdan bir `.png`, bir `.zip` ve bir `.txt` dosyasını ölçün. Neden ilk ikisi 8'e yakın çıkıyor?
- `-p` pencere boyutunu 64 ve 4096 yapın. Küçük pencerede rastgele verinin entropisi neden 8'e ulaşamıyor?
- Sezgisel bir kural yazın: "entropi 7,2'den büyükse şüpheli". Hangi zararsız dosya türleri yanlış pozitif verir?
