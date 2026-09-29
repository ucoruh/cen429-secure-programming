# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 3: path traversal (Python, pathlib)
#
#   BAD  : the request is appended straight onto the root; ../secret.txt
#          escapes OUTSIDE the root.
#   GOOD : the path is canonicalized with .resolve() and checked to still be
#          INSIDE the root (Path.is_relative_to); an absolute path is rejected.
#
# ALL files are produced under the demo folder's output/; nothing is ever
# read outside it. NO DOWNLOAD REQUIRED.
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE / "output"
ROOT = BASE / "data"
SECRET = BASE / "secret.txt"


def line():
    print("-" * 62)


def prepare():
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "report.txt").write_text(
        "Public report (synthetic).\n", encoding="utf-8")
    SECRET.write_text(
        "SECRET: synthetic admin note (outside the root).\n", encoding="utf-8")


def read_bad(request):
    # No check at all. The request is appended to the root and read.
    target = ROOT / request
    try:
        content = target.read_text(encoding="utf-8").strip()
        print("   Resolved path: " + os.path.normpath(str(target)))
        print("   READ -> " + content)
    except OSError as err:
        print("   (Read error: " + str(err) + ")")


def is_within_root(candidate, root):
    # Python 3.9+: is_relative_to. Fallback for older versions.
    try:
        return candidate.is_relative_to(root)
    except AttributeError:
        return os.path.commonpath([str(candidate), str(root)]) == str(root)


def resolve_safely(request):
    """GOOD (the security check itself, as a pure function): canonicalize the
    request against ROOT and decide whether it stays inside. Returns None when
    the request is rejected, or the safe, canonical Path when accepted."""
    root = ROOT.resolve()
    if os.path.isabs(request):
        return None   # absolute path / drive letter: rejected
    candidate = (root / request).resolve()
    if not is_within_root(candidate, root):
        return None   # escapes outside the root: rejected
    return candidate


def read_secure(request):
    safe = resolve_safely(request)
    if safe is None:
        if os.path.isabs(request):
            print("   REJECTED: absolute path / drive letter.")
        else:
            candidate = (ROOT.resolve() / request).resolve()
            print("   REJECTED: escapes outside the root -> " + str(candidate))
        return
    try:
        content = safe.read_text(encoding="utf-8").strip()
        print("   Resolved path: " + str(safe))
        print("   READ -> " + content)
    except OSError as err:
        print("   (Read error: " + str(err) + ")")


def main():
    prepare()

    line()
    print("Root folder (only this should ever be served): " + str(ROOT))
    print("STEP 1 - Legitimate request: 'report.txt'")
    print("[BAD WAY]")
    read_bad("report.txt")
    print("[GOOD WAY]")
    read_secure("report.txt")

    line()
    print("STEP 2 - ATTACK: '../secret.txt' (outside the root)")
    print("[BAD WAY]")
    read_bad(os.path.join("..", "secret.txt"))
    print("   ^ The secret file outside the root was leaked.")
    print("[GOOD WAY]")
    read_secure(os.path.join("..", "secret.txt"))
    print("   ^ resolve() + root check blocked it.")

    line()
    print("STEP 3 - ATTACK: an absolute-path attempt")
    print("[GOOD WAY] request = an absolute path")
    bad = "C:\\Windows" if os.name == "nt" else "/etc/hostname"
    read_secure(bad)

    line()
    print("Result: appending the user's path to the root and reading it is")
    print("unsafe. Verify with resolve() + a root check + rejecting absolute paths.")


if __name__ == "__main__":
    sys.exit(main())
