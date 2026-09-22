# CEN429 Güvenli Programlama — Ders Notları

Recep Tayyip Erdoğan Üniversitesi, Bilgisayar Mühendisliği · Dr. Öğr. Üyesi Uğur CORUH

**Ders sitesi:** <https://ucoruh.github.io/cen429-secure-programming/>

Bu depo dersin bütün malzemesini tek yerde tutar: ders notları (site), sunumlar ve derste gösterilen çalışan
kod örnekleri. Notlar kendi başına yeterlidir; dışarıdan bir kaynağa ihtiyaç duymadan çalışılabilir.

## Klasörler

| Klasör | İçerik |
| --- | --- |
| [`docs/`](docs/) | Ders sitesinin kaynağı (MkDocs Material): izlence ve haftalık ders notları (TR/EN) |
| [`slides/`](slides/) | Haftalık sunumların kaynağı (Marp) |
| [`code/`](code/) | Derste gösterilen demolar ve kendi başınıza çalışacağınız alıştırmalar — her hafta bir klasör |
| [`tools/`](tools/) | Siteyi ve belgeleri yerelde üretme betikleri, git yardımcıları |

## Uygulamaları çalıştırmak

Laboratuvar ortamının kurulumu ve güvenlik kuralları için [`code/README.md`](code/README.md) dosyasını okuyun.
Kısaca: Windows'ta WSL2 ile Ubuntu, ardından her demo klasöründe `make demo`.

## Siteyi yerelde görmek

```bash
py -3.12 -m pip install -r requirements.txt
py -3.12 tools/site.py serve      # http://127.0.0.1:8000/cen429-secure-programming/tr/
```

## Lisans

Ders notları ve kod örnekleri eğitim amaçlıdır. Saldırı teknikleri yalnızca kendi bilgisayarınızda ve verilen demolar
üzerinde denenmelidir.
