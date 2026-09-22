/*
 * CEN429 — Hafta 1 — Demo 2: Bellekte kalan parola
 *
 * Program parolayı bir dosyadan okur, onunla bir "anahtar" hesaplar ve işi bitince parolayı
 * bellekten silmeye çalışır. Silme yöntemi derleme sırasında SILME makrosuyla seçilir:
 *
 *   SILME=0  hiç silmez                                      (en kötü)
 *   SILME=1  memset(parola, 0, ...) ile siler                (derleyici bunu kaldırabilir!)
 *   SILME=2  explicit_bzero / SecureZeroMemory ile siler     (derleyici kaldıramaz)
 *
 * Silme işleminden sonra program bekle() fonksiyonunda durur ve o andaki belleği bir dosyaya
 * dökülür; demo betiği dosyada parolayı arar. Bu, bir saldırganın çökme dökümünden, takas
 * alanından ya da hata ayıklayıcıyla bellekten sır çalmasının güvenli bir benzetimidir.
 *   Linux  : demo.sh programı gdb altında başlatır, bekle()'de durdurup "gcore" ile döker.
 *   Windows: program bekle()'de, CEN429_DOKUM ortam değişkeni verilmişse, kendi belleğinin
 *            dökümünü (MiniDumpWriteDump) AYRI BİR İŞ PARÇACIĞINDAN alır; böylece döküm
 *            çağrısı yığındaki eski parola baytlarının üzerine yazmaz.
 */
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include "cen429_demo.h"

#ifdef _WIN32
#include <io.h>
#include <windows.h>
#include <dbghelp.h>
#define dosya_ac(y) _open((y), _O_RDONLY | _O_BINARY)
#define dosya_oku _read
#define dosya_kapat _close
#else
#include <unistd.h>
#define dosya_ac(y) open((y), O_RDONLY)
#define dosya_oku read
#define dosya_kapat close
#endif

#ifndef SILME
#define SILME 0
#endif

#ifdef _WIN32
static DWORD WINAPI dokum_al(LPVOID yol)
{
    HANDLE f = CreateFileA((const char *)yol, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (f == INVALID_HANDLE_VALUE)
        return 1;
    BOOL ok = MiniDumpWriteDump(GetCurrentProcess(), GetCurrentProcessId(), f, MiniDumpWithFullMemory,
                                NULL, NULL, NULL);
    CloseHandle(f);
    return ok ? 0 : 1;
}
#endif

/* Demonun durduğu nokta. noinline: derleyici bu fonksiyonu yok etmesin. */
#if defined(_MSC_VER)
__declspec(noinline)
#else
__attribute__((noinline))
#endif
void bekle(void)
{
#ifdef _WIN32
    char yol[MAX_PATH];
    if (GetEnvironmentVariableA("CEN429_DOKUM", yol, MAX_PATH)) {
        HANDLE t = CreateThread(NULL, 0, dokum_al, yol, 0, NULL);
        if (t) {
            WaitForSingleObject(t, INFINITE);
            CloseHandle(t);
        }
    }
#else
    /* Boş fonksiyona yapılan çağrıyı GCC -O2 tümden siler; gdb'nin duracağı yer kalmaz.
       Bu boş asm satırı "burada gözlenebilir bir şey oluyor" der ve çağrıyı korur. */
    __asm__ __volatile__("" ::: "memory");
#endif
}

/* Parolayı "kullanan" basit bir hesap (gerçekte bir anahtar türetme fonksiyonu olurdu). */
static unsigned long anahtar_turet(const char *p, size_t n)
{
    unsigned long h = 5381;
    for (size_t i = 0; i < n; i++)
        h = h * 33 + (unsigned char)p[i];
    return h;
}

#if defined(_MSC_VER)
__declspec(noinline)
#else
__attribute__((noinline))
#endif
unsigned long giris_yap(const char *dosya)
{
    char parola[64];

    /* Düşük düzey okuma: stdio tamponu kullanılmaz, parola yalnız bu dizide durur. */
    int fd = dosya_ac(dosya);
    if (fd < 0)
        return 0;
    int n = (int)dosya_oku(fd, parola, sizeof(parola) - 1);
    dosya_kapat(fd);
    if (n <= 0)
        return 0;
    while (n > 0 && (parola[n - 1] == '\n' || parola[n - 1] == '\r'))
        n--;
    parola[n] = '\0';

    unsigned long anahtar = anahtar_turet(parola, (size_t)n);

#if SILME == 1
    memset(parola, 0, sizeof(parola));             /* "ölü yazma": bir daha okunmuyor */
#elif SILME == 2
#ifdef _WIN32
    SecureZeroMemory(parola, sizeof(parola));      /* derleyici kaldıramaz */
#else
    explicit_bzero(parola, sizeof(parola));        /* derleyici kaldıramaz */
#endif
#endif
    return anahtar;
}

/*
 * Gerçek programlarda parola, arayüz -> oturum -> anahtar türetme gibi DERİN bir çağrı
 * zincirinde işlenir. Sonradan çağrılan sığ fonksiyonlar (printf, bekle) o bölgeye inmez,
 * bu yüzden silinmeyen kalıntı uzun süre yaşar. Bu fonksiyon o derinliği taklit eder;
 * böylece sonuç, printf'in yığında ne kadar yer kullandığına bağlı olmaz.
 */
#if defined(_MSC_VER)
__declspec(noinline)
#else
__attribute__((noinline))
#endif
unsigned long derin_cagri_zinciri(const char *dosya)
{
    volatile char cerceveler[16384];                  /* aradaki çağrıların yığın alanı */
    cerceveler[0] = 0;
    return giris_yap(dosya) + (unsigned long)cerceveler[0];
}

int main(int argc, char **argv)
{
    demo_hazirla();
    const char *dosya = argc > 1 ? argv[1] : "parola.txt";
    unsigned long anahtar = derin_cagri_zinciri(dosya);
    printf("Anahtar hesaplandi: %lx (SILME=%d)\n", anahtar, SILME);
    bekle();                                          /* bellek burada dökülür */
    return 0;
}
