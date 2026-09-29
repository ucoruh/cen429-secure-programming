# -*- coding: utf-8 -*-
# CEN429 - Week 5 - Demo 1: SQL injection (Python, built-in sqlite3)
#
# This program needs NO DOWNLOAD: sqlite3 ships with Python. It creates a
# small database at 'output/demo.db' inside the demo folder, then runs the
# same login two ways:
#   1) BAD  : embeds the user input into the SQL text by string concatenation.
#   2) GOOD : uses a parameterized query (question mark); input is only a VALUE.
#
# The attack only ever touches this demo's own database; no system file is
# touched, no network is used. Every value is synthetic.
import os
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(HERE, "output")
DB_PATH = os.path.join(OUTPUT, "demo.db")


def line():
    print("-" * 62)


def set_up_database():
    """Build a small user table from scratch (synthetic data)."""
    if os.path.isdir(OUTPUT):
        # Clean up a database left over from a previous run.
        if os.path.isfile(DB_PATH):
            os.remove(DB_PATH)
    else:
        os.makedirs(OUTPUT)
    db = sqlite3.connect(DB_PATH)
    db.execute(
        "CREATE TABLE user ("
        " id INTEGER PRIMARY KEY,"
        " name TEXT,"
        " password TEXT,"
        " role TEXT,"
        " secret_note TEXT)"
    )
    db.executemany(
        "INSERT INTO user (name, password, role, secret_note) VALUES (?,?,?,?)",
        [
            ("alice", "password123", "user", "Alice private note"),
            ("bob", "1234", "user", "Bob private note"),
            ("admin", "S3cr3t-Admin", "admin", "Admin secret key"),
        ],
    )
    db.commit()
    return db


def build_bad_query(name, password):
    """BAD: the SQL text built by string concatenation. Pure function (no
    database access) so its exact output is unit-testable."""
    return (
        "SELECT id, name, role FROM user "
        "WHERE name = '" + name + "' AND password = '" + password + "'"
    )


def build_secure_query():
    """GOOD: the fixed parameterized template; it never depends on the
    caller's values, so there is nothing to concatenate."""
    return "SELECT id, name, role FROM user WHERE name = ? AND password = ?"


def login_bad(db, name, password):
    """BAD: embeds the input directly into the SQL text (string concatenation)."""
    query = build_bad_query(name, password)
    print("   Generated SQL:")
    print("   " + query)
    try:
        rows = db.execute(query).fetchall()
    except sqlite3.Error as err:
        print("   (SQL error: " + str(err) + ")")
        return []
    return rows


def login_secure(db, name, password):
    """GOOD: parameterized query; input can never become part of the command."""
    query = build_secure_query()
    print("   Generated SQL (template):")
    print("   " + query + "   [values sent separately]")
    return db.execute(query, (name, password)).fetchall()


def print_result(rows):
    if not rows:
        print("   -> No rows. LOGIN REJECTED.")
        return
    print("   -> " + str(len(rows)) + " row(s) returned. LOGIN SUCCESSFUL:")
    for r in rows:
        print("      id=" + str(r[0]) + " name=" + r[1] + " role=" + r[2])


def main():
    db = set_up_database()

    line()
    print("STEP 1 - Honest user: name='alice' password='password123'")
    print("[BAD WAY]")
    print_result(login_bad(db, "alice", "password123"))
    print("[GOOD WAY]")
    print_result(login_secure(db, "alice", "password123"))

    line()
    print("STEP 2 - ATTACK: password field set to  ' OR '1'='1")
    attacker_password = "' OR '1'='1"
    print("[BAD WAY]  <-- expecting a login without knowing the password")
    print_result(login_bad(db, "alice", attacker_password))
    print("   ^ Logged in without knowing the password: query structure changed.")
    print("[GOOD WAY]")
    print_result(login_secure(db, "alice", attacker_password))
    print("   ^ Input was searched for as a VALUE; no such password exists: rejected.")

    line()
    print("STEP 3 - ATTACK: pulling the admin row through the name field")
    print("         name =  ' OR role='admin' --")
    attacker_name = "' OR role='admin' --"
    print("[BAD WAY]")
    print_result(login_bad(db, attacker_name, "doesn't matter"))
    print("   ^ Another user's (admin's) row was leaked.")
    print("[GOOD WAY]")
    print_result(login_secure(db, attacker_name, "doesn't matter"))
    print("   ^ No such name exists: no leak.")

    line()
    print("STEP 4 - Why isn't 'escaping' enough by itself?")
    print("   Naive fix: double every single quote ( ' -> '' ).")
    print("   But it does nothing when the input sits in a NUMBER context (no")
    print("   quotes at all); escaping rules also differ between databases.")
    print("   The correct fix is ALWAYS a parameterized query (question mark).")

    db.close()
    line()
    print("Result: do NOT embed input into SQL text. Use a parameterized query;")
    print("input can then never change the command's structure.")


if __name__ == "__main__":
    sys.exit(main())
