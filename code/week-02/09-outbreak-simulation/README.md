# Demo 09 — Worm outbreak simulation (the SI model)

**Topic:** How fast worms spread, and spreading strategies (random scanning, a hitlist) ·
**Week:** 2 · **Source:** the SI outbreak model; Staniford, Paxson, Weaver, "How to 0wn the
Internet in Your Spare Time" (2002) — conceptual.

## What it shows

Simulates a worm spreading across a network with the **Susceptible–Infected (SI)** outbreak model. The program
performs no network operation, connects to nothing, and produces no file; it only solves this difference
equation and prints the result as an ASCII bar chart:

```text
i(t+dt) = i(t) + beta * i(t) * (1 - i(t)/N) * dt
```

Here `i(t)` is the number of infected machines, `N` the total number of vulnerable machines, and `beta` the
infection rate. In the early (exponential) phase, **doubling time = ln(2)/beta**.

| Scenario | What it represents | Lesson |
| --- | --- | --- |
| Code-Red-like | Slow random scanning (TCP) | Spreads over hours |
| Slammer-like | Fast random scanning (a single UDP packet) | Spreads over minutes |
| Hitlist | Same speed, but starts from a ready target list (i0 is large) | The slow opening phase disappears |

The `beta` values used are **examples**; the lecture notes discuss the doubling times actually observed
(Slammer ~8.5 s, Code Red ~37 min).

## Running it

First build all the demos once (inside the `code/` folder): Windows `.\build.ps1` ·
WSL / Linux `./build.sh`. Then, inside this folder:

| Environment | Command |
| --- | --- |
| Windows (PowerShell) | `.\demo.ps1` — or double-click `demo.cmd` |
| WSL / Linux | `sh demo.sh` |

## Why it's safe

- The program does **only arithmetic**: it steps through a difference equation. There is no network, file,
  process, or persistence; it connects to nothing.
- The "worm" is only a **number** (a count of infected machines); there is no self-replicating code anywhere.

## Try it yourself

- In `outbreak.c`, double the Slammer `beta` value. How did the doubling time and the time to 90% saturation
  change?
- Set the hitlist size (`i0`) to 100, 1000, and 40000. How does the opening phase shorten?
- Why did the real Slammer slow down after one minute? (Hint: did it run out of vulnerable machines, or did it
  saturate network bandwidth?)
