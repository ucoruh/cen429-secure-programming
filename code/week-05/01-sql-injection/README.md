# Demo 1 — SQL injection: string concatenation vs parameterized query

**Topic:** Input validation, injection defense (CWE-89) · **Week:** 5 ·
**Book:** Viega & Messier, Recipe 3.11 (SQL injection), 3.1 (basic input validation)

## What it shows

A login/search query is built **two ways**:

- **BAD:** user input is embedded into the SQL text by **string concatenation**.
  Typing `' OR '1'='1` into the `password` field changes the query's **structure**;
  the attacker logs in without knowing the password, or leaks another user's
  (the admin's) row.
- **GOOD:** a **parameterized query** (`?`) is used. Because the input is sent to
  the engine separately, it is only a **value**; it can never change the command's
  structure, and the attack is rejected.

The main demo runs with Python's **built-in `sqlite3`** module and needs **no
download at all**. The optional Java section shows the same idea with a real JDBC
`PreparedStatement` (the SQLite JDBC driver is downloaded by the `prepare` script).

| Step | What happens | Lesson |
| --- | --- | --- |
| 1 | Honest login: both ways work | Bad code looks "correct" in the normal case |
| 2 | `' OR '1'='1` -> bad way logs in anyway | Input changed the command's structure |
| 3 | `' OR role='admin' --` -> another row leaks | The comment (`--`) deletes the rest of the query |
| 4 | Why doesn't escaping suffice? | It depends on context/DB; a parameter is the definitive fix |

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

The Java (JDBC) section is **optional**. To download the driver:

| Environment | Command |
| --- | --- |
| Windows | `.\prepare.ps1` |
| WSL / Linux | `sh prepare.sh` |

`prepare` downloads the `org.xerial:sqlite-jdbc:3.42.0.0` jar from Maven Central at a
**pinned version, verified by SHA-256**, into `lib\`. The jar never enters the
repository (it is in `.gitignore`). Without the driver the demo still runs the Python
section and skips the Java one.

Tools needed: **Python 3** (main demo), optional **JDK 17/21** (Java section).

## Why it's safe

- Every attack only ever touches the demo's **own** database. The Python demo creates
  `output/demo.db` inside the demo folder; the Java demo keeps its database
  **in memory** (`jdbc:sqlite::memory:`). No system file is touched.
- No network is used; no administrator privilege is requested. All values are synthetic.

## Try it yourself

1. Pass `' OR '1'='1` to the `login_secure` calls in `sql_injection.py` too. Why does
   the attack not work against a parameterized query? (Hint: the engine searches for
   the input as a text value.)
2. Add a "naive escape" to the bad path (`name.replace("'", "''")`). Is input
   containing `--` still effective? Is escaping enough in a numeric context
   (`WHERE id = ` + input)?
3. Run the Java demo with `prepare`; compare what `loginBad` and `loginSecure` send to
   the engine. Why does `PreparedStatement` separate "structure" from "value"?
