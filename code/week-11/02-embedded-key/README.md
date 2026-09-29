# Week 11 · Demo 2 — Embedded key (naive fix)

Shows that **embedding a key in the software is not protection**: the program opens its own
compiled binary and finds its (synthetic) 16-byte embedded key by a plain byte-array scan, the
same scan a white-box attacker would run.

## Running it

Build with CMake, then run `bin/<platform>/embedded_key` (prints a pseudo-checksum and a usage
line) or `bin/<platform>/embedded_key --scan` (scans the binary and prints where the key was
found).

## Safety

The key is entirely synthetic; the program only reads its own file, never the network or another
file on disk, and changes no system setting.
