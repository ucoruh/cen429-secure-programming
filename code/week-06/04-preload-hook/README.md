# Demo 4 — LD_PRELOAD / function hook detection · Linux / WSL only

**Topic:** RASP detection — dynamic instrumentation / hook detection (LD_PRELOAD, PLT/GOT, the Frida/Xposed
family) · **Week:** 6 · **Catalog:** K7 (RTLD_NEXT address comparison), K8 (LD_PRELOAD environment)

## What it shows

An attacker **preloads** a library with `LD_PRELOAD` and replaces standard functions the application calls
(`time`, `getenv`, ...) with their own version (**interposition**). This can lie to Demo 2's anti-debug checks.
This demo catches it with two techniques:

1. Is the `LD_PRELOAD` environment variable non-empty? — a weak signal (`getenv` itself can be spoofed).
2. **Which shared object** does a critical function actually resolve from? `dlsym(RTLD_DEFAULT, ...)` gets the
   function's address, `dladdr` finds the `.so` file that provides that address. If something other than libc
   comes out: **a hook is present.**

| Step | What happens |
| --- | --- |
| 1 | Runs with no `LD_PRELOAD`: `time`/`getenv` resolve from libc → **clean** |
| 2 | `libfake_hook.so` is loaded with `LD_PRELOAD` into this process only → `time` resolves from that `.so`, returns a fixed fake value → **HOOK DETECTED** |

## Running it

This demo runs **only on Linux / WSL**. On Windows, `demo.ps1` explains this (the Windows equivalent is
IAT/inline hook detection, which needs a different API).

On WSL/Linux: `./build.sh` inside `code/`, then `sh demo.sh` in this folder.

## Why is it safe?

- `LD_PRELOAD` only affects **a single command** (the demo process); nothing is written permanently to the shell
  or the system.
- The fake hook library (`fake_hook.c`) only takes over `time()` and returns a fixed value; it prints nothing and
  touches no file. A completely harmless demonstration.

## Try it yourself

1. Add `getenv` to `fake_hook.c` too (make it return empty, to hide `LD_PRELOAD`). Does signal 1 still catch it?
   Does signal 2 (dladdr) still catch it? Why is that one more robust?
2. Run Demo 2 (`antidebug`) under `LD_PRELOAD` with this hook. Can `ptrace`/`TracerPid` be spoofed too?
3. How does Frida work in the real world, and why is scanning `/proc/self/maps` (K18) an additional signal?
