#!/bin/sh
# CEN429 — Week 1 — Demo 3: Privilege escalation through buffer overflow (Linux / WSL)
# Build first: ../../build.sh     Then: ./demo.sh
# Programs that are expected to crash are only restricted for that one command:
#   prlimit --core=1:1  -> no crash dump is produced (this also covers WSL's own crash handler)
#   timeout 20          -> no demo can hang forever
#   setarch ... -R      -> address randomization is off only for this process (older GCC's ASan
#                          library needs this on newer kernels); no system setting is changed
cd "$(dirname "$0")"
B=bin/linux
[ -x "$B/login" ] || { echo "Build first: ../../build.sh"; exit 1; }
RUN="prlimit --core=1:1 timeout 20"
ASAN="$RUN setarch $(uname -m) -R"
SHORT=AAAAAAAAAAAAAAAAB                         # 16 characters + 'B' (0x42)
LONG=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA    # 40 characters: overflows past the struct
line() { echo "--------------------------------------------------------------"; }

line; echo "STEP 1 - Normal login";                             echo "\$ ./$B/login alice"; "./$B/login" alice
line; echo "STEP 2 - Attack: a name 1 byte longer than the 16-byte field (17 characters)"
echo "\$ ./$B/login $SHORT"; "./$B/login" "$SHORT"
line; echo "STEP 3 - Same attack, in the AddressSanitizer build"
echo "\$ ./$B/login_asan $SHORT"; $ASAN "./$B/login_asan" "$SHORT"
echo "   ^ ASan stayed silent: the overflow stayed INSIDE the struct."
echo "     (name -> admin; tools have their limits too)"
line; echo "STEP 4 - A long name that overflows past the struct, ASan version"
echo "\$ ./$B/login_asan <40 characters>"
$ASAN "./$B/login_asan" "$LONG" 2>&1 | grep -E 'ERROR|WRITE of size|SUMMARY' || true
line; echo "STEP 5 - Same short attack, in the build compiled with _FORTIFY_SOURCE=2"
echo "\$ ./$B/login_checked $SHORT"
$RUN "./$B/login_checked" "$SHORT" 2>&1 || echo "   (the program was stopped by the check the compiler added)"
line; echo "STEP 6 - The fixed version"
echo "\$ ./$B/login_secure $SHORT"; "./$B/login_secure" "$SHORT" || true
echo "\$ ./$B/login_secure alice";  "./$B/login_secure" alice
