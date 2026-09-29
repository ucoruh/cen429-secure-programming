# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 2: command injection (Python)
#
#   BAD  : subprocess ... shell=True  ->  input goes to the shell as text;
#          ';' or '&' starts an extra command.
#   GOOD : subprocess ... [argument list]  ->  no shell; input is one argument.
#
# The injected command only ever prints a HARMLESS message. No file is
# deleted/changed; no network is used. NO DOWNLOAD REQUIRED.
import os
import re
import subprocess
import sys

WINDOWS = os.name == "nt"
ALLOWED = re.compile(r"^[A-Za-z0-9_]+$")


def line():
    print("-" * 62)


def print_output(completed):
    for out in (completed.stdout or "").splitlines():
        print("   | " + out)


def build_bad_command(name):
    """BAD: the single shell command STRING. Pure function (no process
    started), kept separate so the exact text handed to the shell is testable."""
    if WINDOWS:
        return "echo TOOL OUTPUT: Hello " + name
    return 'echo "TOOL OUTPUT: Hello" ' + name


def is_allowed(name):
    """GOOD: the allow-list predicate. Default-deny: anything that is not
    letters/digits/underscore is rejected, including shell separators."""
    return ALLOWED.match(name) is not None


def build_secure_args(name):
    """GOOD: the exact argument list subprocess would run. No shell is
    involved, so 'name' is never re-parsed -- it is exactly one element."""
    return [sys.executable, "-c",
            "import sys; print('TOOL OUTPUT: Hello', sys.argv[1])", name]


def run_bad(name):
    full = build_bad_command(name)
    print("   Command sent to the shell:")
    print("   " + full)
    print_output(subprocess.run(full, shell=True, capture_output=True, text=True))


def run_secure(name):
    if not is_allowed(name):
        print("   Allow-list REJECTED it (^[A-Za-z0-9_]+$):")
        print("   input = " + name)
        print("   -> The program was never run.")
        return
    cmd = build_secure_args(name)
    print("   Argument list:")
    print("   [python, -c, ...] ... '" + name + "'")
    print_output(subprocess.run(cmd, capture_output=True, text=True))


def main():
    sep = "& " if WINDOWS else "; "
    harmless = "echo LEAKED-COMMAND-INJECTION"

    line()
    print("STEP 1 - Honest input: name = 'Alice'")
    print("[BAD WAY]")
    run_bad("Alice")
    print("[GOOD WAY]")
    run_secure("Alice")

    line()
    print("STEP 2 - ATTACK: name contains an extra command")
    bad_name = "Alice " + sep + harmless
    print("   name = " + bad_name)
    print("[BAD WAY]  <-- the shell also runs the second command")
    run_bad(bad_name)
    print("   ^ The 'LEAKED...' line = the injected command ran.")
    print("[GOOD WAY]  <-- the same input is just harmless text")
    run_secure(bad_name)
    print("   ^ The allow-list saw a space/;/& and rejected it.")

    line()
    print("Result: shell=True + string concatenation is DANGEROUS. Use an")
    print("argument list (shell=False) + an allow-list.")


if __name__ == "__main__":
    sys.exit(main())
