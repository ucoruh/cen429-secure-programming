#!/bin/sh
# CEN429 - Week 4 - Demo 1: format string vulnerability (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
# Steps that could crash are bounded with prlimit+timeout (no core dump, a time limit).
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/leak" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 20"
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 0 - Does the compiler see this bug?"
echo "\$ gcc -Wformat -Wformat-security -fsyntax-only -I../../common leak.c"
gcc -Wformat -Wformat-security -fsyntax-only -I../../common leak.c 2>&1 \
    | grep -i 'format' | head -2
echo "   -> -Wformat-security warns about a non-constant format string."
line; echo "STEP 1 - Normal use"
echo "\$ ./$B/leak Hello"; "./$B/leak" Hello
line; echo "STEP 2 - Attack: %x READS memory off the stack (information leak)"
FMT='%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x'
echo "\$ ./$B/leak '$FMT'"
OUT=$("./$B/leak" "$FMT" 2>/dev/null)
echo "$OUT"
echo "$OUT" | grep -oq '5ece7' \
    && echo "   ^ secret_value leaked -> 0x0005ece7 (read off the stack)" \
    || echo "   ^ the hex words are stack contents; one of them may be secret_value"
line; echo "STEP 3 - Attack: %n tries to WRITE to memory (unprotected version)"
echo "\$ ./$B/leak 'AAAA%n'"
$RUN "./$B/leak" 'AAAA%n' 2>&1 || \
    echo "   (the program crashed/was stopped; exit $?)"
line; echo "STEP 4 - The same %n attack, built with _FORTIFY_SOURCE=2"
echo "\$ ./$B/leak_checked 'AAAA%n'"
$RUN "./$B/leak_checked" 'AAAA%n' 2>&1 || \
    echo "   (FORTIFY: %n into writable memory was rejected)"
line; echo "STEP 5 - Fixed version: %x and %n are now just TEXT"
echo "\$ ./$B/leak_secure '%x %x %n attack attempt'"
"./$B/leak_secure" '%x %x %n attack attempt'
