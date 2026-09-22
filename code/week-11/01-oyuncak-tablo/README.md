# Hafta 11 · Demo 1 — Oyuncak whitebox tablosu (savunma dersi)

8-bitlik sentetik bir kutuda gösterir: **anahtarı arama tablosuna gömmek, tablo
kodlanmadıkça anahtarı gizlemez.** Naif tablo `T[x]=S[x^k]` anahtarı sızdırır;
kodlanmış tablo `T2[x]=E[S[x^k]]` naif okumayı durdurur. (Gerçek WB-AES ya da gerçek
saldırı aracı değildir; kavramı gösterir.)

## Çalıştırma
CMake ile derleyin, sonra `bin/<platform>/oyuncak_wb` çalıştırın.

## Güvenlik
Tümüyle sentetik; dosya/ağ/sistem işlemi yok. WB = katman, çözüm değil (DCA/DFA ile kırıldı).
