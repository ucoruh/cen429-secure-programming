#!/bin/sh
# CEN429 - Week 4 - Demo 5: compiler and OS protections (Linux / WSL)
# Build first: ../../build.sh     Then: sh demo.sh
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/overflow_weak" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 20"
LONG=$(printf 'A%.0s' $(seq 1 200))
line() { echo "--------------------------------------------------------------"; }

# Summarizes an ELF binary's protections (via readelf).
protection_summary() {
    ELF="$1"
    printf "  PIE/ASLR : "; readelf -h "$ELF" | grep -q 'Type:.*DYN' \
        && echo "ON (Type=DYN, PIE)" || echo "off (Type=EXEC)"
    printf "  NX (DEP) : "; readelf -lW "$ELF" | grep -q 'GNU_STACK.*RWE' \
        && echo "off (stack is executable)" || echo "ON (stack RW, not executable)"
    printf "  RELRO    : "
    if readelf -lW "$ELF" | grep -q 'GNU_RELRO'; then
        readelf -dW "$ELF" | grep -q 'BIND_NOW\|FLAGS.*NOW' \
            && echo "FULL (RELRO + BIND_NOW)" || echo "partial (GNU_RELRO only)"
    else echo "none"; fi
    printf "  Canary   : "; readelf -sW "$ELF" | grep -q '__stack_chk_fail' \
        && echo "ON (__stack_chk_fail)" || echo "off"
    printf "  FORTIFY  : "; readelf -sW "$ELF" | grep -qE '_chk@' \
        && echo "ON (*_chk symbols)" || echo "off"
}

line; echo "STEP 1 - Normal input: both versions run fine"
echo "\$ ./$B/overflow_weak island"; $RUN "./$B/overflow_weak" island
echo "\$ ./$B/overflow_hardened island"; $RUN "./$B/overflow_hardened" island
line; echo "STEP 2 - WEAK version, a 200-byte overflow (no canary)"
echo "\$ ./$B/overflow_weak <200xA>"
$RUN "./$B/overflow_weak" "$LONG" 2>&1; echo "   (exit code: $? ; 139=SIGSEGV)"
line; echo "STEP 3 - HARDENED version, same overflow: the canary CATCHES the corruption"
echo "\$ ./$B/overflow_hardened <200xA>"
$RUN "./$B/overflow_hardened" "$LONG" 2>&1 | grep -iE 'stack smashing|terminated' | head -1
echo "   (exit code: $? ; the program was stopped safely)"
line; echo "STEP 4 - Which protections are on in each binary? (readelf)"
echo "WEAK binary:";     protection_summary "$B/overflow_weak"
echo "HARDENED binary:"; protection_summary "$B/overflow_hardened"
line
echo "Lesson: these protections do NOT fix the bug; they only make exploitation harder/stop it."
echo "The real fix is input validation and bounds checking (Demos 1-4)."
