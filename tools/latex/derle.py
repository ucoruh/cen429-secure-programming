# -*- coding: utf-8 -*-
"""CEN429 LaTeX (TikZ) çizimlerini derler: .tex -> .pdf -> .svg + .png (aynı klasöre, aynı adla).

Kullanım (depo kökünden):
    py -3.12 tools/latex/derle.py docs/week-2/assets/h02-01-haftanin-resmi.tex   # tek dosya
    py -3.12 tools/latex/derle.py --hafta 2,3                                    # haftanın tüm .tex'leri
    py -3.12 tools/latex/derle.py --hepsi

Gereken: TeX Live (pdflatex, tikz, standalone, tgheros) ve pdftocairo (Poppler, TeX Live ile gelir).
SVG'de yazılar yol (path) olarak gömülür; yazı tipi olmayan makinede de aynı görünür.
"""
import os, sys, glob, shutil, subprocess, tempfile, pathlib

KOK = pathlib.Path(__file__).resolve().parents[1].parent
STIL = pathlib.Path(__file__).resolve().parent


def derle(tex):
    tex = pathlib.Path(tex).resolve()
    ad = tex.stem
    with tempfile.TemporaryDirectory() as td:
        ortam = dict(os.environ, TEXINPUTS=f'{STIL}{os.pathsep}{tex.parent}{os.pathsep}')
        r = subprocess.run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', f'-output-directory={td}',
                            str(tex)], cwd=tex.parent, env=ortam, capture_output=True, text=True,
                           encoding='utf-8', errors='replace')
        pdf = pathlib.Path(td) / f'{ad}.pdf'
        if r.returncode != 0 or not pdf.exists():
            hata = [s for s in r.stdout.splitlines() if s.startswith('!') or 'Error' in s][:4]
            print(f'  HATA {tex.name}: {" | ".join(hata) or r.stdout[-300:]}')
            return False
        svg, png = tex.with_suffix('.svg'), tex.with_suffix('.png')
        subprocess.run(['pdftocairo', '-svg', str(pdf), str(svg)], check=True)
        subprocess.run(['pdftocairo', '-png', '-r', '220', '-singlefile', str(pdf), str(png.with_suffix(''))],
                       check=True)
    print(f'  tamam {tex.relative_to(KOK)}')
    return True


if __name__ == '__main__':
    arg = sys.argv[1:]
    if not arg:
        sys.exit(__doc__)
    if arg[0] == '--hepsi':
        dosyalar = sorted(glob.glob(str(KOK / 'docs' / 'week-*' / 'assets' / '*.tex')))
    elif arg[0] == '--hafta':
        dosyalar = []
        for h in arg[1].split(','):
            dosyalar += sorted(glob.glob(str(KOK / 'docs' / f'week-{int(h)}' / 'assets' / '*.tex')))
    else:
        dosyalar = arg
    ok = sum(derle(d) for d in dosyalar)
    print(f'{ok}/{len(dosyalar)} çizim derlendi')
    sys.exit(0 if ok == len(dosyalar) else 1)
