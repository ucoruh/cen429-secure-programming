# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 3 unit test (plain Python, stdlib only).
#
# Tests the security-check logic against a small, disposable directory tree
# created in the OS temp folder (never inside the repository, never touching
# any real system file) and removed again at the end.
import os
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import path_traversal as demo  # noqa: E402

checks = 0
failures = 0


def check(condition, what):
    global checks, failures
    checks += 1
    if not condition:
        failures += 1
        print("FAIL: " + what)


def is_within(root, request):
    """Re-implements demo.resolve_safely() against an arbitrary root, since
    the module's own resolve_safely() is hard-wired to the module-level ROOT
    constant (used by the demo's own main()). This keeps the test independent
    from the demo's global state -- a lab root the test itself controls."""
    if os.path.isabs(request):
        return None
    candidate = (root / request).resolve()
    if not demo.is_within_root(candidate, root.resolve()):
        return None
    return candidate


def main():
    lab = Path(tempfile.mkdtemp(prefix="cen429-path-test-"))
    try:
        root = lab / "data"
        root.mkdir(parents=True)
        (root / "report.txt").write_text("public", encoding="utf-8")
        (root / "sub").mkdir()
        (root / "sub" / "nested.txt").write_text("nested", encoding="utf-8")
        (lab / "secret.txt").write_text("secret", encoding="utf-8")
        sibling = lab / "data-secret"
        sibling.mkdir()
        (sibling / "x.txt").write_text("sibling secret", encoding="utf-8")

        # --- Legitimate requests ---
        check(is_within(root, "report.txt") is not None,
              "resolve: a plain file in the root is accepted")
        check(is_within(root, "sub/nested.txt") is not None,
              "resolve: a file in a legitimate subfolder is accepted")
        r2 = is_within(root, "sub/nested.txt")
        check(r2 is not None and str(r2).startswith(str(root.resolve())),
              "resolve: the accepted subfolder path stays inside the root")

        # --- Attack: parent-directory traversal ---
        check(is_within(root, os.path.join("..", "secret.txt")) is None,
              "resolve: '../secret.txt' is rejected (escapes the root)")
        check(is_within(root, "../secret.txt") is None,
              "resolve: '../secret.txt' with a forward slash is rejected too")
        check(is_within(root, "sub/../../secret.txt") is None,
              "resolve: a deeper 'sub/../../secret.txt' traversal is rejected")
        check(is_within(root, "sub/../report.txt") is not None,
              "resolve: 'sub/../report.txt' normalizes back INSIDE the root and is accepted")

        # --- Attack: absolute path ---
        check(is_within(root, str(lab.resolve())) is None,
              "resolve: an absolute path is always rejected, even if it points inside the root")

        # --- Boundary: empty request resolves to the root itself ---
        check(is_within(root, "") is not None,
              "resolve: an empty request resolves to the root itself, accepted")

        # --- Boundary: sibling folder sharing a name prefix must not leak in ---
        check(is_within(root, "../data-secret/x.txt") is None,
              "resolve: a sibling folder sharing a name prefix is still rejected")

        # --- A few more legitimate shapes .resolve() must still accept ---
        check(is_within(root, "./report.txt") is not None,
              "resolve: a leading './' is accepted (normalizes to the same file)")
        check(is_within(root, "sub/./nested.txt") is not None,
              "resolve: a redundant './' in the middle of the path is accepted")
        check(is_within(root, "sub") is not None,
              "resolve: a request naming just the subfolder itself is accepted")

        # --- Non-existent paths: containment check works either way ---
        check(is_within(root, "does-not-exist.txt") is not None,
              "resolve: a non-existent file inside the root is still accepted")
        check(is_within(root, "../does-not-exist-either.txt") is None,
              "resolve: a non-existent path that escapes the root is rejected too")

        print(str(checks) + " checks, " + str(failures) + " failures")
        return 1 if failures else 0
    finally:
        shutil.rmtree(lab, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
