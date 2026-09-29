# Demo 7 — Control-flow flattening and opaque predicates

**Topic:** Code obfuscation, CFG flattening, opaque predicates · **Week:** 4 ·
**Book:** Viega & Messier, Recipe 12.3 (obfuscating code) · Collberg et al. taxonomy 1997

## What it shows

A small PIN check is written two ways: a natural `if` chain (`pin.c`) and a hand-**flattened**
form (`pin_flattened.c`) — every step is placed in a `switch` dispatcher inside a single infinite
loop. The output is **identical**, but the control-flow graph (CFG) differs: adjacency between
blocks is gone, which makes reverse engineering harder. This is the hand-made equivalent of
Tigress's `--Transform=Flatten` (Week 14). `opaque.c` then adds an **opaque predicate**: a
condition (`(x*x) % 4 != 2`) that is provably true for every possible integer `x` — a fact from
number theory, not something a disassembler can see at a glance — used to add a branch, and a decoy
function, that always resolve the same way no matter what `x` is.

| Step | What happens |
| --- | --- |
| 1 | Both versions give the same result for the same PINs (4291 is correct) |
| 2 | `objdump`/`dumpbin` compares `pin_verify`'s machine code (more jumps in the flattened version) |
| 3 | Timing measurement: the cost of flattening (slowdown) |
| 4 | `opaque` shows the result never depends on `x`, and the decoy branch never runs |

## Running it

First, inside the `code/` folder: Windows `.\build.ps1` · WSL / Linux `./build.sh`.
Then, inside this folder: Windows `.\demo.ps1` (or `demo.cmd`) · WSL / Linux `sh demo.sh`.
For a per-function CFG, `objdump -d` on WSL/Linux is clearest; Ghidra also works on Windows.

## Why it's safe

- The program only checks its own PIN; it never touches any system. The correct PIN is
  **synthetic**. Obfuscation does not make analysis unbreakable, it only raises the reverse
  engineering **cost**; that is why it is applied only to critical functions, and combined with
  layers like RASP/cryptography.

## Try it yourself

1. In `pin_flattened.c`, shuffle the state numbers (change the `case` labels). Does the output
   change? Does the CFG?
2. Build both versions with `-O2`. Can the compiler partially "unflatten" the dispatcher back?
   (Hint: without an opaque predicate guarding it, a dispatcher can sometimes be simplified away.)
3. Find a different modular-arithmetic fact that is always true (e.g. involving mod 8) and turn it
   into a new opaque predicate in `opaque.c`.
