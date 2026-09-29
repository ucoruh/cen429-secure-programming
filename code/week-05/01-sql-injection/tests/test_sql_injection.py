# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 1 unit test (plain Python, stdlib only).
#
# Tests only the PURE query-building functions of sql_injection.py
# (build_bad_query / build_secure_query): no database is opened. Checks that
# the bad path lets attacker input change the SQL's structure, and that the
# good path's template never contains any user value at all.
#
# Convention (matches the Java tests and code/common/test_check.h used by the
# C tests): prints "<checks> checks, <failures> failures" and exits 1 on any
# failure.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import sql_injection as demo  # noqa: E402

checks = 0
failures = 0


def check(condition, what):
    global checks, failures
    checks += 1
    if not condition:
        failures += 1
        print("FAIL: " + what)


def main():
    # --- Normal (honest) input ---
    q1 = demo.build_bad_query("alice", "password123")
    check(q1 == "SELECT id, name, role FROM user WHERE name = 'alice'"
                " AND password = 'password123'",
          "build_bad_query: normal input produces the expected literal SQL")
    check("'alice'" in q1, "build_bad_query: normal name is quoted in place")
    check("'password123'" in q1, "build_bad_query: normal password is quoted in place")

    # --- Empty input ---
    q2 = demo.build_bad_query("", "")
    check(q2 == "SELECT id, name, role FROM user WHERE name = ''"
                " AND password = ''",
          "build_bad_query: empty name/password still produces valid-looking SQL text")

    # --- Attack 1: authentication bypass via ' OR '1'='1 ---
    q3 = demo.build_bad_query("alice", "' OR '1'='1")
    check("OR '1'='1'" in q3,
          "build_bad_query: the ' OR '1'='1 payload survives into the SQL text unescaped")
    check(q3.count("'") != 4,
          "build_bad_query: attack input changes the quote count from the honest case (4)")

    # --- Attack 2: row exfiltration via ' OR role='admin' -- ---
    q4 = demo.build_bad_query("' OR role='admin' --", "doesn't matter")
    check("OR role='admin'" in q4,
          "build_bad_query: the admin-role payload survives into the SQL text unescaped")
    check("--" in q4,
          "build_bad_query: the comment marker that discards the password clause survives too")

    # --- Boundary: a single quote alone breaks the string open ---
    q5 = demo.build_bad_query("'", "'")
    check(q5.count("'") == 6,
          "build_bad_query: a lone quote in each field adds exactly two quote characters (4 -> 6)")

    # --- Long input: no truncation ---
    long_name = "a" * 500
    q6 = demo.build_bad_query(long_name, "x")
    check(len(q6) > 500, "build_bad_query: a long name is not truncated")
    check(("'" + long_name + "'") in q6,
          "build_bad_query: a long name is still embedded verbatim")

    # --- build_secure_query: fixed template, independent of any input ---
    s1 = demo.build_secure_query()
    check(s1 == "SELECT id, name, role FROM user WHERE name = ? AND password = ?",
          "build_secure_query: returns the exact parameterized template")
    check(s1 == demo.build_secure_query(),
          "build_secure_query: is deterministic (same result every call)")
    check("'" not in s1, "build_secure_query: the template contains no quote characters at all")

    # --- The decisive comparison ---
    check("OR '1'='1'" not in s1,
          "build_secure_query: the authentication-bypass payload text is nowhere in the template")
    check("admin" not in s1,
          "build_secure_query: the role-exfiltration payload text is nowhere in the template")
    check(s1.count("?") == 2,
          "build_secure_query: the template has exactly two placeholders, one per value")

    print(str(checks) + " checks, " + str(failures) + " failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
