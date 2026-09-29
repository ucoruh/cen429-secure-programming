#!/usr/bin/env python3
"""CEN429 - Week 14 - Demo 1: end-to-end source-to-source pipeline check.

Used by CTest (see CMakeLists.txt's week-14/01-source-to-source/pipeline-e2e test) and
runnable by hand. Runs the full pipeline for TWO diversification seeds and checks:

  1. semantic equivalence -- every transformed variant's output matches the ORIGINAL
     program's output, for both a valid and an invalid token (obfuscation and
     diversification must never change behaviour, only the generated code);
  2. diversification -- the two seeds' compiled variants differ byte-for-byte.

Uses the real Tigress tool (https://tigress.wtf) if `tigress` is found on PATH; otherwise
prints a message and falls back to fallback_transform.py's documented local approximation
(see that file's docstring) -- the pipeline is still exercised end to end either way, it is
only the transform step that is skipped and replaced when Tigress is not installed.

Compiling the transformed variants is ad hoc (their source does not exist until this script
generates it, so CMake cannot declare ordinary targets for them): on Windows this locates
MSVC via vswhere.exe + vcvars64.bat, the same way common/cen429_msvc.ps1's Invoke-Cl does
for demo.ps1 scripts; on Linux/WSL it uses $CC or cc/gcc/clang from PATH.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "source.c"
TOKENS = ["CEN429-OK", "wrong-token"]
SEEDS = [1001, 2002]


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def find_vcvars64():
    pf86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
    vswhere = Path(pf86) / "Microsoft Visual Studio" / "Installer" / "vswhere.exe"
    if not vswhere.exists():
        return None
    r = run([str(vswhere), "-latest", "-products", "*",
             "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
             "-property", "installationPath"])
    vs_path = r.stdout.strip().splitlines()[0] if r.stdout.strip() else ""
    if not vs_path:
        return None
    vcvars = Path(vs_path) / "VC" / "Auxiliary" / "Build" / "vcvars64.bat"
    return vcvars if vcvars.exists() else None


def compile_c(src: Path, out_exe: Path):
    if os.name == "nt":
        vcvars = find_vcvars64()
        if not vcvars:
            sys.exit("SKIP: no C compiler available (MSVC not found -- install the 'Desktop "
                      "development with C++' workload) -- pipeline cannot be compiled/tested")
        # A temp .bat file is used instead of `cmd /c "<composed string>"`: Python's argv-list
        # quoting (list2cmdline) and cmd.exe's own /c quote-stripping rules disagree on nested
        # quotes + "&&", which silently breaks the command (see progress notes). A .bat file
        # sidesteps that mismatch entirely -- no nested quoting, just plain lines.
        bat = out_exe.parent / "_compile.bat"
        bat.write_text(
            f'@echo off\r\n'
            f'call "{vcvars}" >nul 2>nul\r\n'
            f'cl /nologo /O2 /Fe:"{out_exe}" "{src}"\r\n',
            encoding="utf-8")
        r = run([str(bat)], cwd=str(out_exe.parent))
    else:
        cc = os.environ.get("CC") or shutil.which("cc") or shutil.which("gcc") or shutil.which("clang")
        if not cc:
            sys.exit("SKIP: no C compiler available (cc/gcc/clang not found and $CC not set) -- "
                      "pipeline cannot be compiled/tested")
        r = run([cc, "-O2", "-o", str(out_exe), str(src)])
    if r.returncode != 0:
        sys.exit(f"FAIL: compiling {src.name} failed:\n{r.stdout}\n{r.stderr}")


def run_prog(exe: Path, arg: str) -> str:
    r = run([str(exe), arg])
    return r.stdout


def tigress_available() -> bool:
    return shutil.which("tigress") is not None


def make_variant_tigress(seed: int, out_c: Path):
    cmd = ["tigress", "--Environment=x86_64:Linux:Gcc:11",
           "--Transform=EncodeLiterals", "--Functions=grant_access",
           "--Transform=AddOpaque", "--Functions=grant_access", "--AddOpaqueKinds=call",
           f"--Seed={seed}", f"--out={out_c}", str(SOURCE)]
    r = run(cmd)
    if r.returncode != 0 or not out_c.exists():
        sys.exit(f"FAIL: tigress failed for seed {seed}:\n{r.stdout}\n{r.stderr}")


def make_variant_fallback(seed: int, out_c: Path):
    r = run([sys.executable, str(HERE / "fallback_transform.py"),
              str(SOURCE), str(out_c), "--seed", str(seed)])
    if r.returncode != 0 or not out_c.exists():
        sys.exit(f"FAIL: fallback_transform.py failed for seed {seed}:\n{r.stdout}\n{r.stderr}")


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="cen429_w14_") as tmp_s:
        tmp = Path(tmp_s)
        exe_suffix = ".exe" if os.name == "nt" else ""

        orig_exe = tmp / f"orig{exe_suffix}"
        compile_c(SOURCE, orig_exe)
        baseline = {t: run_prog(orig_exe, t) for t in TOKENS}
        print("pipeline_check.py: original program compiled and run for "
              f"{len(TOKENS)} tokens (baseline captured)")

        using_tigress = tigress_available()
        if using_tigress:
            print("pipeline_check.py: Tigress found on PATH -- using the real tool")
            make_variant = make_variant_tigress
        else:
            print("pipeline_check.py: Tigress NOT found on PATH -- SKIPPING the real-tool step "
                  "and using the documented local fallback transform instead "
                  "(see fallback_transform.py; install Tigress from https://tigress.wtf for the "
                  "real pipeline)")
            make_variant = make_variant_fallback

        variant_exes = []
        for seed in SEEDS:
            variant_c = tmp / f"variant_{seed}.c"
            make_variant(seed, variant_c)
            variant_exe = tmp / f"variant_{seed}{exe_suffix}"
            compile_c(variant_c, variant_exe)
            variant_exes.append(variant_exe)
            for token in TOKENS:
                out = run_prog(variant_exe, token)
                if out != baseline[token]:
                    sys.exit(f"FAIL: SEMANTIC MISMATCH seed={seed} token={token!r}: "
                             f"original produced {baseline[token]!r}, variant produced {out!r}")
            print(f"pipeline_check.py: seed {seed} -- semantic equivalence OK "
                  f"({len(TOKENS)}/{len(TOKENS)} tokens match the original's output)")

        b1, b2 = variant_exes[0].read_bytes(), variant_exes[1].read_bytes()
        if b1 == b2:
            sys.exit(f"FAIL: DIVERSIFICATION FAILED -- seeds {SEEDS[0]} and {SEEDS[1]} produced "
                     "byte-identical binaries")
        diff_bytes = sum(1 for x, y in zip(b1, b2) if x != y) + abs(len(b1) - len(b2))
        print(f"pipeline_check.py: diversification OK -- seeds {SEEDS[0]} and {SEEDS[1]} differ "
              f"in at least {diff_bytes} byte(s) ({len(b1)}-byte vs {len(b2)}-byte binary)")
        print("pipeline_check.py: PIPELINE CHECK PASSED")
        return 0


if __name__ == "__main__":
    sys.exit(main())
