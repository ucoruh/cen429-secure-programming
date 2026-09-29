# Demo 4 — Attack tree cost calculator

**Topic:** Attack trees (Schneier), the cheapest path, defence in depth · **Week:** 2

## What it shows

Reads an attack tree from a text file and computes every node's "cheapest attack cost" bottom-up: an **OR**
node picks the cheapest of its children (whatever suits the attacker), an **AND** node takes the sum of its
children (because all of them are required). The root's cost = the cheapest way to reach the goal; the program
also draws that path (the critical chain to defend).

The second tree shows how the cheapest path changes once RASP is added to the "read from memory" branch — that
is, it puts a number on how much a defence raises the cost of an attack.

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` · WSL / Linux `./build.sh` ·
Visual Studio: **File > Open > Folder** → `code` → choose a configuration → **Build > Build All**. Then, inside
this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

Write your own tree: `.\bin\windows\tree.exe tree-payment.txt` (Windows) or `./bin/linux/tree tree-payment.txt`
(Linux). The format is explained at the top of `tree.c` (indentation = depth, a leaf gives `cost=`).

## Why it's safe

This is a **calculator**: it carries out no attack and touches no file; it only adds up the numbers in the tree
and picks the smallest.

## Try it yourself

- If the root were an **AND** (a goal that needs every branch at once), how would the cost change? Is that
  realistic?
- What would change if, instead of leaf costs in "person-days", we used "probability" and computed with a
  product?
- Write an attack tree for your own term project (at least 8 leaves). Which is the cheapest path? Which
  countermeasure there raises the cost the most?
