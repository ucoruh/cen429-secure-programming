# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 2 unit test (plain Python, stdlib only).
#
# Tests the pure functions of command_injection.py: build_bad_command (the
# string the shell would see), is_allowed (the allow-list predicate) and
# build_secure_args (the argument list subprocess would run). No process is
# ever started here.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import command_injection as demo  # noqa: E402

checks = 0
failures = 0


def check(condition, what):
    global checks, failures
    checks += 1
    if not condition:
        failures += 1
        print("FAIL: " + what)


def main():
    # --- build_bad_command: honest input (platform-dependent prefix, but the
    #     injected suffix behaviour is what matters and is the same shape) ---
    honest = demo.build_bad_command("Alice")
    check(honest.endswith("Alice"), "build_bad_command: honest name ends up at the end of the command")
    check("TOOL OUTPUT" in honest, "build_bad_command: honest command still greets correctly")

    # --- build_bad_command: attack input survives verbatim (that IS the bug) ---
    injected = "Alice ; echo LEAKED-COMMAND-INJECTION"
    bad_cmd = demo.build_bad_command(injected)
    check("; echo LEAKED-COMMAND-INJECTION" in bad_cmd,
          "build_bad_command: a ';' separator followed by a second command survives unescaped")
    check(bad_cmd.endswith(injected),
          "build_bad_command: the whole malicious string is appended verbatim, unmodified")

    # --- build_bad_command: empty input, no exception ---
    empty_cmd = demo.build_bad_command("")
    check(isinstance(empty_cmd, str) and len(empty_cmd) > 0,
          "build_bad_command: empty name still produces a non-empty command string")

    # --- is_allowed: normal identifiers pass ---
    check(demo.is_allowed("Alice"), "is_allowed: a plain name is accepted")
    check(demo.is_allowed("user_42"), "is_allowed: letters/digits/underscore are accepted")
    check(demo.is_allowed("A"), "is_allowed: a single letter is accepted")

    # --- is_allowed: empty input is rejected (pattern requires 1+ chars) ---
    check(not demo.is_allowed(""), "is_allowed: empty string is rejected")

    # --- is_allowed: shell metacharacters are rejected (default-deny) ---
    check(not demo.is_allowed("Alice ; echo x"), "is_allowed: rejects a space and ';'")
    check(not demo.is_allowed("Alice & echo x"), "is_allowed: rejects '&'")
    check(not demo.is_allowed("Alice | echo x"), "is_allowed: rejects '|'")
    check(not demo.is_allowed("Alice`whoami`"), "is_allowed: rejects backticks")
    check(not demo.is_allowed("Alice$(whoami)"), "is_allowed: rejects '$(...)' command substitution")
    check(not demo.is_allowed("Alice\tBob"), "is_allowed: rejects a tab character")
    check(not demo.is_allowed("Alice\nBob"), "is_allowed: rejects a newline (multi-line injection)")

    # --- build_secure_args: the name becomes exactly one list element ---
    args1 = demo.build_secure_args("Alice ; echo LEAKED")
    check(len(args1) == 4, "build_secure_args: the argument list always has exactly 4 elements")
    check(args1[-1] == "Alice ; echo LEAKED",
          "build_secure_args: the whole hostile string is ONE argument, never split by a shell")
    check(args1[1] == "-c",
          "build_secure_args: the fixed interpreter flag is unaffected by the input")

    print(str(checks) + " checks, " + str(failures) + " failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
