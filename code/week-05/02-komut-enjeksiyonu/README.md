# Demo 2 — Komut enjeksiyonu: kabuk dizesi vs argüman listesi

**Konu:** Komut enjeksiyonu, dış program çağırma (CWE-78) · **Hafta:** 5 ·
**Kitap:** Viega & Messier, Tarif 3.1 (girdi doğrulama), 1.7–1.8 (dış programı
güvenli çalıştırma)

## Ne gösteriyor?

Bir "selamlama aracı" bir kullanıcı adını dış bir programa iletir:

- **KÖTÜ:** Komut tek bir **dize** olarak kabuğa verilir (`sh -c` / `cmd /c` ya da
  Java'da `Runtime.exec(String)`). Girdideki `;` (Linux) veya `&` (Windows) kabukta
  **ikinci bir komut** başlatır. Demo'da enjekte edilen komut yalnızca zararsız bir
  `echo` çalıştırır — ama gerçek saldırıda dosya silme/çalma olabilirdi.
- **İYİ:** `ProcessBuilder` (Java) / `subprocess` **argüman listesi** (Python) kullanılır.
  Kabuk yoktur; girdi tek bir **argüman** olarak, veri gibi geçer. Ek olarak bir
  **izin listesi** (`^[A-Za-z0-9_]+$`, varsayılan-reddet) girdiyi çalıştırmadan önce
  doğrular.

İki dilde de aynı ders: **kabuk üzerinden dize kurmayın**; argüman listesi verin.

## Çalıştırma

| Ortam | Komut |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — ya da `demo.cmd`'ye çift tıklayın |
| WSL / Linux | `sh demo.sh` |

Python bölümü her zaman çalışır; Java bölümü **JDK 17/21** varsa çalışır. **İndirme
gerektirmez.** Java demosunun çalıştırdığı "araç" `java -cp bin Yazici` olup PATH'teki
`java`'yı kullanır (öğrencide zaten kurulu).

## Neden güvenli?

- Enjekte edilen komut yalnızca ekrana bir mesaj basan `echo`'dur; **hiçbir dosya
  silinmez/değiştirilmez**, ağ kullanılmaz, yönetici yetkisi istenmez.
- Çalıştırılan tek program, demonun kendi `Yazici` sınıfı (argümanlarını yazar) ya da
  Python yorumlayıcısıdır. Sistemin başka hiçbir aracı çağrılmaz.

## Kendiniz deneyin

1. `echo SIZDI` yerine `echo` ile başka zararsız bir metin yazdırın. Neden kabuk bu
   ikinci komutu da çalıştırıyor? `&` / `;` / `|` / `&&` ayıraçlarını deneyin.
2. İzin listesini gevşetin (boşluğa izin verin). Hangi girdiler artık geçiyor? Bu
   neden tehlikeli? "Varsayılan-reddet" ilkesi neden "kötüyü ara"dan daha güvenli?
3. Java'da `calistirKotu`'yu argüman listesine çevirin (`ProcessBuilder`). Aynı kötü
   girdiyle ne oluyor? Kabuk devreden çıkınca `&` neden anlamını yitiriyor?
