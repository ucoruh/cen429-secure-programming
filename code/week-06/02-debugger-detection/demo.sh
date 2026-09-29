#!/bin/sh
# CEN429 - Week 6 - Demo 2: Debugger detection (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/antidebug" ] || { echo "Build first: ../../build.sh"; exit 1; }
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Normal run (NO debugger): clean is expected"
"$B/antidebug" && echo "   (exit code 0 - clean)"

line; echo "STEP 2 - Run under gdb (TracerPid > 0 is expected)"
if command -v gdb >/dev/null 2>&1; then
    # gdb runs the program while tracing it (ptrace); we show the relevant output lines.
    gdb -batch -nx -ex run -ex quit "$B/antidebug" 2>/dev/null | grep -E "TracerPid|RESULT" \
        || echo "   (could not filter gdb's output)"
else
    echo "   (gdb is not installed: sudo apt install -y gdb)"
    echo "   strace also works: strace -f $B/antidebug"
fi

line
echo "Note: without gdb TracerPid=0 (clean), under gdb it is >0 (detected)."
echo "Every signal can be evaded; what matters is combining several signals"
echo "with a response (Demo 8)."
