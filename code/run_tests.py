"""CEN429 test runner: configures, builds and runs CTest for one or more weeks under code/week-NN.

For each requested week (a week with no code/week-NN/CMakeLists.txt at all — e.g. a Java/Python/shell-only
week — is reported as "no CMake project" and skipped, not treated as a failure):

  (Windows) configures MSVC scoped to just that week into code/build/win-weekNN (gitignored), with
  compiler warnings promoted to errors for every target except one explicitly marked ALLOW_WARNINGS in its
  CMakeLists.txt (see cen429_add_demo() in cmake/cen429.cmake), builds it, and runs ctest from inside that
  build folder.

  (Linux) copies code/common, code/cmake, code/CMakeLists.txt, code/CMakePresets.json and the requested
  week-NN folder(s) to a local folder outside Google Drive (%TEMP%\\cen429-test-wNN\\, one per week — WSL cannot
  see a G:\\ Google-Drive-mounted path at all), then runs cmake + build + ctest for that week inside WSL,
  with the WSL process's cwd on that local folder. With --sanitize, the Linux build also turns on
  UndefinedBehaviorSanitizer on every MODE asan target (-DCEN429_UBSAN=ON; those targets already build with
  AddressSanitizer regardless of --sanitize) and the ctest run is wrapped in `setarch "$(uname -m)" -R`,
  because gcc 9's ASan is flaky (DEADLYSIGNAL) under high-entropy ASLR; ctest also excludes tests labeled
  "plain-vulnerable" in that pass (see code/README.en.md's Testing section for what that label means).

Prints one summary line per (week, platform): "week N (platform): X passed, Y failed". A week whose
CMakeLists.txt exists but registers no CTest tests yet still gets a build-only check and reports "0 tests"
(0 passed, 0 failed) once the build itself succeeds; a build or configure failure is reported as 1 failed
("configure"/"build") with the compiler/linker output as detail.

Usage (from the repository root):
    py -3.12 code/run_tests.py --week 1 [--week 3 ...] [--sanitize] [--platform win|linux|both] [-v]
Exit status 1 when anything failed.
"""
import argparse
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent  # .../code
CONFIGURE_TIMEOUT = 180
BUILD_TIMEOUT = 900
CTEST_TIMEOUT = 600
COPY_IGNORE = shutil.ignore_patterns(
    "build", "bin", "desktop.ini", "*.exe", "*.dll", "*.pdb", "*.obj", "*.ilk", "*.exp", "*.lib")

CTEST_SUMMARY_RE = re.compile(r"(\d+)% tests passed, (\d+) tests? failed out of (\d+)")


def run(cmd, cwd=None, timeout=BUILD_TIMEOUT, env=None):
    try:
        p = subprocess.run(cmd, cwd=cwd, capture_output=True, timeout=timeout,
                            stdin=subprocess.DEVNULL, env=env)
        return p.returncode, (p.stdout + p.stderr).decode("utf-8", "replace").replace("\r\n", "\n")
    except subprocess.TimeoutExpired:
        return 124, "TIMEOUT"
    except FileNotFoundError as e:
        return 127, str(e)


def wsl_path(p):
    p = str(p).replace("\\", "/")
    return "/mnt/" + p[0].lower() + p[2:]


class WeekResult:
    def __init__(self, week, platform):
        self.week, self.platform = week, platform
        self.passed = 0
        self.failed = 0
        self.details = []  # (label, detail) for every failure

    def fail(self, label, detail=""):
        self.failed += 1
        self.details.append((label, detail))

    def add_ctest_summary(self, log_text):
        m = CTEST_SUMMARY_RE.search(log_text)
        if m:
            pct, failed, total = (int(x) for x in m.groups())
            self.failed += failed
            self.passed += total - failed
            if failed:
                self.details.append(("ctest", log_text[-4000:]))
        elif "No tests were found" in log_text or "No tests to run" in log_text.lower():
            pass  # 0 passed, 0 failed — a build-only week
        else:
            # Unexpected ctest output shape; treat as a single failed check so it is never silently lost.
            self.fail("ctest (unparsed output)", log_text[-2000:])

    def report(self, verbose):
        print(f"week {self.week} ({self.platform}): {self.passed} passed, {self.failed} failed")
        if self.failed and verbose:
            for label, detail in self.details:
                print(f"  FAIL {label}")
                if detail:
                    print("       " + detail.strip().replace("\n", "\n       ")[:2000])


def week_dir(n):
    return ROOT / f"week-{n:02d}"


def windows_pass(n, sanitize, verbose):
    res = WeekResult(n, "windows")
    build_dir = ROOT / "build" / f"win-week{n:02d}"
    if verbose:
        print(f"== week {n:02d} windows: configuring")
    rc, out = run(["cmake", "-S", str(ROOT), "-B", str(build_dir),
                   "-G", "Visual Studio 17 2022", "-A", "x64",
                   f"-DCEN429_WEEKS=week-{n:02d}", "-DCEN429_WARNINGS_AS_ERRORS=ON"],
                  timeout=CONFIGURE_TIMEOUT)
    if rc != 0:
        res.fail("configure", out[-3000:])
        res.report(verbose)
        return res
    if verbose:
        print(f"== week {n:02d} windows: building")
    # /m:1 (serial): Google Drive's file sync locks CMake's regen "stamp" files under parallel MSBuild,
    # which fails as "Cannot restore timestamp" / "has not been created" — a known trap in this repo
    # (it lives on a synced Drive folder), not a real build error. One retry covers the rare case where
    # the first attempt still lands mid-sync.
    for attempt in range(2):
        rc, out = run(["cmake", "--build", str(build_dir), "--config", "Debug",
                       "--", "/m:1", "/v:minimal", "/nologo"], timeout=BUILD_TIMEOUT)
        if rc == 0 or "Cannot restore timestamp" not in out:
            break
    if rc != 0:
        res.fail("build", out[-4000:])
        res.report(verbose)
        return res
    if verbose:
        print(f"== week {n:02d} windows: ctest")
    rc, out = run(["ctest", "-C", "Debug", "--output-on-failure"],
                  cwd=str(build_dir), timeout=CTEST_TIMEOUT)
    res.add_ctest_summary(out)
    res.report(verbose)
    return res


def prepare_linux_root(linux_root, weeks):
    shutil.rmtree(linux_root, ignore_errors=True)
    linux_root.mkdir(parents=True)
    for name in ("common", "cmake", "CMakeLists.txt", "CMakePresets.json"):
        src = ROOT / name
        dst = linux_root / name
        if not src.exists():
            continue
        if src.is_dir():
            shutil.copytree(src, dst, ignore=COPY_IGNORE)
        else:
            shutil.copy(src, dst)
    for n in weeks:
        src = week_dir(n)
        if src.exists():
            shutil.copytree(src, linux_root / src.name, ignore=COPY_IGNORE, dirs_exist_ok=True)


def linux_pass(n, sanitize, linux_root, verbose):
    res = WeekResult(n, "linux")
    suffix = "-sanitize" if sanitize else ""
    build = f"build/linux-week{n:02d}{suffix}"
    extra_defines = " -DCEN429_UBSAN=ON" if sanitize else ""
    # setarch -R (disable ASLR) unconditionally: a week's MODE asan targets are ASan-instrumented
    # regardless of --sanitize (asan is a per-target MODE, not gated behind this flag), and gcc 9's
    # ASan reports a bogus DEADLYSIGNAL at random under WSL/Ubuntu's default high-entropy ASLR.
    ctest_cmd = 'setarch "$(uname -m)" -R ctest --output-on-failure'
    if sanitize:
        ctest_cmd += " -LE plain-vulnerable"
    script = f'''#!/bin/sh
cd "$(dirname "$0")"
mkdir -p build
rm -rf "{build}"
cmake -S . -B "{build}" -DCMAKE_BUILD_TYPE=Debug -DCEN429_WEEKS=week-{n:02d} -DCEN429_WARNINGS_AS_ERRORS=ON{extra_defines} > "{build}.configure.log" 2>&1
echo "CEN429_CONFIGURE_RC $?"
cmake --build "{build}" -- -j"$(nproc 2>/dev/null || echo 2)" > "{build}.build.log" 2>&1
echo "CEN429_BUILD_RC $?"
cd "{build}" && {ctest_cmd} > "../../{build}.ctest.log" 2>&1
echo "CEN429_CTEST_RC $?"
'''
    script_path = linux_root / f"_run_week{n:02d}{suffix}.sh"
    script_path.write_text(script, encoding="utf-8", newline="\n")
    if verbose:
        print(f"== week {n:02d} linux{' (sanitize)' if sanitize else ''}: configure+build+ctest (WSL)")
    rc, out = run(["wsl", "-e", "sh", wsl_path(script_path)], cwd=str(linux_root),
                  timeout=CONFIGURE_TIMEOUT + BUILD_TIMEOUT + CTEST_TIMEOUT)
    stage_rc = {mm.group(1): int(mm.group(2)) for mm in
                re.finditer(r"CEN429_(\w+)_RC (-?\d+)", out)}

    def read_log(stage):
        p = linux_root / f"{build}.{stage}.log"
        return p.read_text(encoding="utf-8", errors="replace") if p.exists() else out

    if "CONFIGURE" not in stage_rc:
        # wsl.exe itself failed to run (not installed, no distro, etc.) — surface the raw output.
        res.fail("wsl invocation", out[-3000:] if out else "(no output — is WSL installed?)")
        res.report(verbose)
        return res
    if stage_rc["CONFIGURE"] != 0:
        res.fail("configure", read_log("configure")[-3000:])
        res.report(verbose)
        return res
    if stage_rc.get("BUILD", 1) != 0:
        res.fail("build", read_log("build")[-4000:])
        res.report(verbose)
        return res
    res.add_ctest_summary(read_log("ctest"))
    res.report(verbose)
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--week", type=int, action="append", required=True)
    ap.add_argument("--sanitize", action="store_true")
    ap.add_argument("--platform", choices=["win", "linux", "both"], default="both")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()

    weeks = sorted(set(a.week))
    with_cmake = [n for n in weeks if (week_dir(n) / "CMakeLists.txt").exists()]
    without_cmake = [n for n in weeks if n not in with_cmake]

    results = []
    for n in without_cmake:
        for platform in (["windows", "linux"] if a.platform == "both" else [
                "windows" if a.platform == "win" else "linux"]):
            print(f"week {n} ({platform}): no CMake project for this week (skipped), 0 tests "
                  f"(0 passed, 0 failed)")

    if with_cmake and a.platform in ("win", "both"):
        for n in with_cmake:
            results.append(windows_pass(n, a.sanitize, a.verbose))

    if with_cmake and a.platform in ("linux", "both"):
        # one folder per week set, so runs for different weeks in parallel never delete each other's tree
        tag = "-".join(f"{n:02d}" for n in with_cmake)
        linux_root = pathlib.Path(os.environ.get("TEMP", tempfile.gettempdir())) / f"cen429-test-w{tag}"
        prepare_linux_root(linux_root, with_cmake)
        for n in with_cmake:
            results.append(linux_pass(n, a.sanitize, linux_root, a.verbose))

    total_passed = sum(r.passed for r in results)
    total_failed = sum(r.failed for r in results)
    print(f"\n{total_passed} passed, {total_failed} failed")
    sys.exit(1 if total_failed else 0)


if __name__ == "__main__":
    main()
