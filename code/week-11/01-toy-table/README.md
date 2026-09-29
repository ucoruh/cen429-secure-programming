# Week 11 · Demo 1 — Toy whitebox table (defensive lesson)

Shows, on an 8-bit synthetic box, that **folding a key into a lookup table does not hide the key
unless the table is also encoded**. The naive table `T[x]=S[x^k]` leaks the key; the encoded table
`T2[x]=E[S[x^k]]` stops naive recovery. (Not real WB-AES, not a real attack tool — it shows the
concept.)

## Running it

Build with CMake, then run `bin/<platform>/toy_table`.

## Safety

Entirely synthetic; no file/network/system operation. WBC = a layer, not a solution (published
designs were still broken by DCA/DFA — see the slides).
