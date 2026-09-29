#!/bin/sh
# CEN429 - Week 6 - Demo 4: LD_PRELOAD / hook detection (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/preload_hook" ] || { echo "Build first: ../../build.sh"; exit 1; }
HOOK="$B/libfake_hook.so"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Normal run (no LD_PRELOAD): clean is expected"
"$B/preload_hook" && echo "   (exit code 0 - clean)"

line; echo "STEP 2 - Attack: the fake hook is preloaded ONLY into this process"
if [ -f "$HOOK" ]; then
    echo "> LD_PRELOAD=$HOOK $B/preload_hook"
    LD_PRELOAD="$HOOK" "$B/preload_hook" || echo "   (exit code 3 - hook DETECTED)"
else
    echo "   (libfake_hook.so is missing; run ../../build.sh)"
fi

line
echo "Note: LD_PRELOAD only affects the single command above; nothing is written"
echo "to the shell environment or the system permanently. time() returned a fake"
echo "value, and dladdr showed the function came from libfake_hook.so, not libc."
