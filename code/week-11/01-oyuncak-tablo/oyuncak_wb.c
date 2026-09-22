/*
 * CEN429 - Hafta 11 - Demo 1: Oyuncak whitebox tablosu (SAVUNMA dersi)
 *
 * Amac: "anahtari bir arama tablosuna gommek, TABLO KODLANMADIKCA anahtari gizlemez"
 * kuralini kucuk, sentetik bir ornekte GORMEK. Gercek WB-AES ya da gercek bir saldiri
 * araci DEGILDIR; 8-bitlik oyuncak bir kutu uzerinde kavrami gosterir.
 *
 * Kurgu (slaytlardaki 5 adimin minik hali):
 *   - Herkese acik bir S-box (S) var (sir degil).
 *   - Gizli bir anahtar bayti k var.
 *   - Bir AES turunun minik hali:  cikti = S[x XOR k].
 *   - NAIF tablo:    T[x]  = S[x XOR k]           -> anahtar SIZAR
 *   - KODLANMIS tablo: T2[x] = E( S[x XOR k] )     -> naif kurtarma BASARISIZ
 *
 * GUVENLIK: Butun degerler sentetiktir; dosya/ag/sistem islemi yoktur.
 */
#include <stdio.h>

/* Herkese acik S-box: affin donusum bir bijeksiyondur (167 tek -> 256 ile aralik).
   Gercek AES S-box'i kopyalamadan, bijeksiyon ozelligini korumak icin kullaniyoruz. */
static unsigned char S[256], Sinv[256];
/* Gizli cikti kodlamasi E de bir bijeksiyondur (91 tek). WB'de bu "ic/dis kodlama". */
static unsigned char E[256];

static void tablolari_kur(void)
{
    for (int x = 0; x < 256; x++) {
        S[x] = (unsigned char)((167 * x + 13) & 0xFF);
        E[x] = (unsigned char)((91 * x + 7) & 0xFF);
    }
    for (int x = 0; x < 256; x++) Sinv[S[x]] = (unsigned char)x;
}

/* Adim 1: anahtari tabloya "pisir" -> T[x] = S[x ^ k]  (kodlama YOK) */
static void naif_tablo(unsigned char k, unsigned char T[256])
{
    for (int x = 0; x < 256; x++) T[x] = S[x ^ k];
}

/* Adim 3-5: cikisa gizli kodlama uygula -> T2[x] = E[S[x ^ k]] */
static void kodlu_tablo(unsigned char k, unsigned char T2[256])
{
    for (int x = 0; x < 256; x++) T2[x] = E[S[x ^ k]];
}

/*
 * NAIF KURTARMA (yalniz bu ders icin, savunmayi sinamak amacli):
 * "T, bilinen S'nin x^k ile otelenmis halidir." Aday k' icin
 * Sinv[T[x]] ^ x sabit mi diye bakariz; sabitse o sabit anahtardir.
 * Kodlu tabloda Sinv[T2[x]] artik S'nin tersine denk gelmez -> sabit cikmaz -> kurtarma coker.
 */
static int naif_kurtar(const unsigned char T[256], int *k_out)
{
    int k0 = Sinv[T[0]] ^ 0;
    for (int x = 1; x < 256; x++)
        if ((Sinv[T[x]] ^ x) != k0) return 0;   /* sabit degil -> kurtarilamadi */
    *k_out = k0;
    return 1;
}

int main(void)
{
    tablolari_kur();
    unsigned char k = 0x3C;   /* gizli anahtar (sentetik) */
    unsigned char T[256], T2[256];
    int bulunan;

    printf("=== Oyuncak whitebox tablosu (savunma dersi) ===\n");
    printf("Gizli anahtar (yalniz dogrulama icin): k = 0x%02X\n\n", k);

    naif_tablo(k, T);
    printf("[1] NAIF tablo  T[x] = S[x ^ k]  (kodlama YOK)\n");
    if (naif_kurtar(T, &bulunan))
        printf("    -> Naif kurtarma anahtari BULDU: 0x%02X  ==> ANAHTAR SIZDI.\n\n", bulunan);
    else
        printf("    -> Kurtarma basarisiz.\n\n");

    kodlu_tablo(k, T2);
    printf("[2] KODLANMIS tablo  T2[x] = E[S[x ^ k]]  (gizli cikis kodlamasi)\n");
    if (naif_kurtar(T2, &bulunan))
        printf("    -> Naif kurtarma buldu: 0x%02X\n", bulunan);
    else
        printf("    -> Naif kurtarma BASARISIZ. Ayni tablodan anahtar dogrudan okunamiyor.\n\n");

    printf("DERS:\n");
    printf("  * Anahtari tabloya gommek tek basina yetmez; kodlanmamis tablo anahtari ele verir.\n");
    printf("  * Ic/dis kodlama naif okumayi durdurur -- ama yayimlanmis WB tasarimlari\n");
    printf("    DCA/DFA gibi genel saldirilarla yine kirildi (slaytlar). WB = KATMAN, cozum degil.\n");
    return 0;
}
