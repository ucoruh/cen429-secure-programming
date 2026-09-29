# Demo 2 — Debugger detection

**Topic:** RASP detection — anti-debug · **Week:** 6 ·
**Book:** Viega & Messier, Recipe 12.13 (Unix/ptrace), 12.14 (Windows/IsDebuggerPresent)

## What it shows

The program figures out, by **reading only**, whether a debugger (gdb, lldb, Visual Studio, x64dbg, WinDbg) is
attached. It looks at several independent signals rather than a single one:

| Platform | Signals |
| --- | --- |
| **Linux / WSL** | `/proc/self/status` → `TracerPid` (>0 means traced); is the parent process's name gdb/strace/ltrace/valgrind? |
| **Windows** | `IsDebuggerPresent` (PEB BeingDebugged); `CheckRemoteDebuggerPresent`; PEB `NtGlobalFlag` (bits 0x70) |

## Running it

First build (inside `code/`): Windows `.\build.ps1` · WSL/Linux `./build.sh`. Then, in this folder:

| Platform | Command | To see it under a debugger |
| --- | --- | --- |
| Windows | `.\demo.ps1` | Set `antidebug` as the Visual Studio startup project and press **F5** |
| WSL / Linux | `sh demo.sh` | `demo.sh` also runs the program under `gdb` itself |

## Why is it safe?

- The program only **reads** `/proc` and PEB fields; it changes no file or system setting and needs no
  administrator privileges. It never traces itself with `ptrace(PTRACE_TRACEME)` (read-only, to avoid any side
  effect).
- `demo.sh` runs the program under `gdb -batch` normally (tracing it); this only affects the demo process.

## Try it yourself

1. On Linux, run `strace -f ./bin/linux/antidebug`. Does TracerPid change? What does the parent process's name
   become?
2. On Windows, run the demo with **F5** (Visual Studio debugger) and **Ctrl+F5** (no debugger). Which signals
   change?
3. Why is a single `if (IsDebuggerPresent()) exit(1);` weak? (Hint: an attacker patches that one call's return
   value; see Demo 4's hook and Demo 5's distributed counter.)
