# Sunumlar

Her haftanın sunumu `week-N/cen429-week-N.tr.md` dosyasındadır (Marp biçimi). Sunumlar ders sitesindeki notlardan
**ayrı** yazılır: slaytlar kısa ve görseldir, ayrıntı sitededir. Konuşma notları `<!-- ... -->` yorumlarındadır ve
Marp'ın sunucu görünümünde görünür.

## Üretme

```bash
marp slides/week-1/cen429-week-1.tr.md -o slides/week-1/cen429-week-1.tr.html   # hızlı, tek dosya
marp slides/week-1/cen429-week-1.tr.md --pdf                                   # PDF (tarayıcı gerekir)
```

Üretilen dosyalar depoya eklenmez; yayın öncesi yerelde üretilir.
