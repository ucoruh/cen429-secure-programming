"""CEN429 ders sitesini yerelde derleme ve önizleme.

Kullanım (depo kökünden):
    py -3.12 tools/site.py serve    # canlı önizleme:
                                    # http://127.0.0.1:8000/cen429-secure-programming/tr/
                                    # (site_url'deki yol öneki adrese eklenir)
    py -3.12 tools/site.py build    # site/ klasörüne derler (hata ve uyarıları gösterir)

GitHub Pages'e yayın bilinçli olarak burada YOK: yayın, içerik incelendikten ve
özel bilgi taraması yapıldıktan sonra ayrıca ve açık onayla yapılır.
"""
import os
import subprocess
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def calistir(*arg):
    komut = [sys.executable, "-m", "mkdocs", *arg]
    print("$", " ".join(komut))
    return subprocess.call(komut, cwd=KOK)


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ("serve", "build"):
        print(__doc__)
        return 2
    if sys.argv[1] == "serve":
        return calistir("serve", "--dev-addr", "127.0.0.1:8000")
    return calistir("build", "--clean")


if __name__ == "__main__":
    sys.exit(main())
