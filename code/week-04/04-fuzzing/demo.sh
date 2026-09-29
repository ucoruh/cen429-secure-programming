#!/bin/sh
# CEN429 - Week 4 - Demo 4: fuzzing (libFuzzer) (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Fuzzing is ALWAYS time-limited (-max_total_time), and all output is written under this demo
# folder's fuzz-out/; nothing is left behind on the system.
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/parser" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 40"
ASAN="$RUN setarch $(uname -m) -R"
line() { echo "--------------------------------------------------------------"; }

D=fuzz-out
rm -rf "$D"; mkdir -p "$D/corpus"
cp seeds/normal.bin "$D/corpus/" 2>/dev/null || true

line; echo "STEP 1 - Normal input parses without trouble"
echo "\$ ./$B/parser seeds/normal.bin"
$ASAN "./$B/parser" seeds/normal.bin 2>&1 | grep -vE '^(==|  )' | head -3 || true

if [ -x "$B/parser_fuzz" ]; then
    line; echo "STEP 2 - Fuzz the BUGGY parser with libFuzzer (<=10 s)"
    echo "\$ ./$B/parser_fuzz -max_total_time=10 $D/corpus"
    $ASAN "./$B/parser_fuzz" -max_total_time=10 -artifact_prefix="$D/" \
        "$D/corpus" 2>&1 | grep -E 'ERROR|overflow|Test unit|SUMMARY|crash-' | head -8 || true
    CRASH=$(ls "$D"/crash-* 2>/dev/null | head -1)
    line; echo "STEP 3 - Replay the crashing input found, with the reproducer"
    if [ -n "$CRASH" ]; then
        echo "\$ ./$B/parser $CRASH"
        $ASAN "./$B/parser" "$CRASH" 2>&1 \
            | grep -E 'ERROR|overflow|READ of size|SUMMARY' | head -5 || true
    else
        echo "   (no separate crash file survived this run; use the ready-made seed instead)"
        $ASAN "./$B/parser" seeds/crash.bin 2>&1 \
            | grep -E 'ERROR|overflow|READ of size|SUMMARY' | head -5 || true
    fi
    line; echo "STEP 4 - Fuzz the FIXED parser for the same time: NO crash"
    echo "\$ ./$B/parser_fuzz_secure -max_total_time=10 $D/corpus"
    $ASAN "./$B/parser_fuzz_secure" -max_total_time=10 \
        -artifact_prefix="$D/" "$D/corpus" 2>&1 \
        | grep -E 'Done|DONE|crash|ERROR' | tail -2 || true
    echo "   ^ something like 'Done ... 0 crashes': the fixed version never crashes."
else
    line; echo "STEP 2 - No clang on this system: no libFuzzer target was built"
    echo "   Ubuntu 24.04 ships clang 18. On Ubuntu 20.04, install it with:"
    echo "     sudo apt-get install -y clang"
    echo "   We can still SEE the bug without a fuzzer, using the ASan reproducer:"
    line; echo "STEP 3 - Replay the ready-made crashing seed with the reproducer"
    echo "\$ ./$B/parser seeds/crash.bin"
    $ASAN "./$B/parser" seeds/crash.bin 2>&1 \
        | grep -E 'ERROR|overflow|READ of size|SUMMARY' | head -6 || true
fi

line; echo "STEP 5 - The fixed version safely rejects the same seed"
echo "\$ ./$B/parser_secure seeds/crash.bin"
$ASAN "./$B/parser_secure" seeds/crash.bin 2>&1 | grep -vE '^(==|  )' | head -3 || true
rm -rf "$D"
