# Demo 3 — Path traversal: canonicalization + root check

**Topic:** Path traversal / directory traversal (CWE-22) · **Week:** 5 ·
**Book:** Viega & Messier, Recipe 3.7 (file name and path validation)

## What it shows

A "file server" should only ever hand out files under `output/data/`:

- **BAD:** the request is appended straight onto the root (`root.resolve(request)`).
  A `../secret.txt` request escapes **outside** the root and leaks the synthetic
  secret file that sits just above it.
- **GOOD:** the path is **canonicalized** (`normalize()` + `toRealPath()` / Python
  `resolve()`) and the result is checked to still be **inside** the root
  (`startsWith` / `is_relative_to`). An absolute path or drive letter is also
  rejected.

On Windows both `\` and `/` separators, and a drive-letter absolute path, are all
handled — canonicalization reduces every one of them to a single real path before
the check runs.

## Running it

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Python always runs; the Java part runs if a **JDK 17/21** is present. **No download
required.**

## Why it's safe

- All files are produced under `output/` in the demo folder: `output/data/report.txt`
  (inside the root) and `output/secret.txt` (one level above it, but **still inside
  the demo folder**). The `../secret.txt` attack never escapes the demo folder itself.
- Content is synthetic; no system file is touched, no network/administrator
  privilege is used.

## Try it yourself

1. Try `data/../secret.txt` or `./../secret.txt` as the request. Does canonicalization
   still catch these? Why is a raw string check ("does it contain `..`?") not enough?
2. Create a subfolder inside the root (`output/data/sub/`) and request a file from
   there. Do legitimate subpaths still work? (The root check must never block
   legitimate access.)
3. On Windows, try a double backslash like `..\\..\\secret.txt`. Why does
   `toRealPath()` still land on the same real file?
